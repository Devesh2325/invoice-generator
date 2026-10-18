'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi } from '@invoice/api';
import {
  Party,
  CanonicalDocument,
  INDIAN_STATES,
  formatCurrency,
  SUPPORTED_CURRENCIES,
} from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Download,
  Upload,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

type CustomerFieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'taxId'
  | 'street1'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country'
  | 'notes';

const CUSTOMER_FIELDS: { key: CustomerFieldKey; label: string; required?: boolean }[] = [
  { key: 'name', label: 'Customer Name', required: true },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'taxId', label: 'Tax ID / GSTIN' },
  { key: 'street1', label: 'Street Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State / GST State' },
  { key: 'postalCode', label: 'Postal / ZIP Code' },
  { key: 'country', label: 'Country' },
  { key: 'notes', label: 'Notes' },
];

interface ParsedImportRow {
  rowNumber: number;
  raw: Record<string, string>;
  mapped: {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    street1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    notes: string;
  };
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateReason?: string;
  rowAction: 'default' | 'skip' | 'update' | 'import';
}

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanText = text.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return { headers: [], rows: [] };

  // Detect delimiter (comma, tab, semicolon)
  const firstLine = cleanText.split(/\r?\n/)[0] || '';
  const delimiter =
    firstLine.includes('\t') && !firstLine.includes(',')
      ? '\t'
      : firstLine.split(';').length > firstLine.split(',').length
      ? ';'
      : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]).map((h, idx) => h || `Column_${idx + 1}`);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.every((v) => !v)) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] ?? '';
    });
    rows.push(record);
  }

  return { headers, rows };
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Locate ZIP local file headers (0x04034b50)
  const files: Record<string, Uint8Array> = {};
  let offset = 0;
  while (offset + 30 < bytes.length) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) {
      offset++;
      continue;
    }
    const compression = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    const fileName = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + fileNameLen));
    const dataStart = offset + 30 + fileNameLen + extraLen;
    const compressedData = bytes.subarray(dataStart, dataStart + compressedSize);

    if (
      fileName === 'xl/sharedStrings.xml' ||
      fileName === 'xl/worksheets/sheet1.xml'
    ) {
      if (compression === 0) {
        files[fileName] = compressedData;
      } else if (compression === 8 && typeof DecompressionStream !== 'undefined') {
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();
          const decompressedBuf = await new Response(ds.readable).arrayBuffer();
          files[fileName] = new Uint8Array(decompressedBuf);
        } catch {
          // ignore decompression failure
        }
      }
    }
    offset = dataStart + (compressedSize || 1);
  }

  const decoder = new TextDecoder();
  const sharedStrings: string[] = [];
  if (files['xl/sharedStrings.xml']) {
    const xml = decoder.decode(files['xl/sharedStrings.xml']);
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const siNodes = Array.from(doc.getElementsByTagName('si'));
    siNodes.forEach((si) => {
      const texts = Array.from(si.getElementsByTagName('t')).map((t) => t.textContent || '');
      sharedStrings.push(texts.join(''));
    });
  }

  if (!files['xl/worksheets/sheet1.xml']) {
    throw new Error('Could not read worksheet from Excel file. Please save as CSV or standard XLSX.');
  }

  const sheetXml = decoder.decode(files['xl/worksheets/sheet1.xml']);
  const parser = new DOMParser();
  const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
  const rowNodes = Array.from(sheetDoc.getElementsByTagName('row'));

  const matrix: string[][] = [];
  const colToIndex = (colRef: string): number => {
    const letters = colRef.replace(/[0-9]/g, '');
    let idx = 0;
    for (let i = 0; i < letters.length; i++) {
      idx = idx * 26 + (letters.charCodeAt(i) - 64);
    }
    return Math.max(0, idx - 1);
  };

  rowNodes.forEach((rowNode) => {
    const cells = Array.from(rowNode.getElementsByTagName('c'));
    const rowValues: string[] = [];
    cells.forEach((c) => {
      const ref = c.getAttribute('r') || 'A1';
      const colIdx = colToIndex(ref);
      const type = c.getAttribute('t');
      const vNode = c.getElementsByTagName('v')[0];
      const isNode = c.getElementsByTagName('is')[0];
      let val = '';
      if (type === 's' && vNode) {
        const sIdx = parseInt(vNode.textContent || '0', 10);
        val = sharedStrings[sIdx] ?? '';
      } else if (type === 'inlineStr' && isNode) {
        val = isNode.textContent || '';
      } else if (vNode) {
        val = vNode.textContent || '';
      }
      rowValues[colIdx] = val.trim();
    });
    if (rowValues.some((v) => v && v.length > 0)) {
      matrix.push(rowValues);
    }
  });

  if (matrix.length === 0) return { headers: [], rows: [] };
  const headers = matrix[0].map((h, i) => h || `Column_${i + 1}`);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const rec: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rec[h] = matrix[i][idx] ?? '';
    });
    rows.push(rec);
  }
  return { headers, rows };
}

export default function TenantPartiesPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [parties, setParties] = useState<Party[]>([]);
  const [documents, setDocuments] = useState<CanonicalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'customer' | 'vendor'>('customer');
  const [modalOpen, setModalOpen] = useState(false);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [uploadedHeaders, setUploadedHeaders] = useState<string[]>([]);
  const [uploadedRows, setUploadedRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<CustomerFieldKey, string>>({
    name: '',
    email: '',
    phone: '',
    taxId: '',
    street1: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    notes: '',
  });
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'import'>('skip');
  const [rowActions, setRowActions] = useState<Record<number, 'default' | 'skip' | 'update' | 'import'>>({});
  const [importFilter, setImportFilter] = useState<'all' | 'valid' | 'duplicates' | 'errors'>('all');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{ rowNumber: number; name: string; reason: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New party form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [gstState, setGstState] = useState('27 - Maharashtra');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('India');
  const [notes, setNotes] = useState('');

  const loadPartiesAndDocs = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const [list, docs] = await Promise.all([
        TenantApi.getParties(activeTenant.id),
        TenantApi.getDocuments(activeTenant.id),
      ]);
      setParties(list);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartiesAndDocs();
  }, [activeTenant]);

  // Compute per-customer financial summary in tenantCurrency
  const customerBalances = useMemo(() => {
    const map: Record<string, { invoiced: number; outstanding: number; count: number }> = {};
    documents.forEach((doc) => {
      if (doc.status === 'cancelled') return;
      const key = (doc.client?.name || '').trim().toLowerCase();
      if (!key) return;
      if (!map[key]) {
        map[key] = { invoiced: 0, outstanding: 0, count: 0 };
      }
      map[key].invoiced += Number(doc.summary?.grandTotal || 0);
      map[key].outstanding += Number(doc.summary?.balanceDue || 0);
      map[key].count += 1;
    });
    return map;
  }, [documents]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchType = p.type === activeTab;
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
        (p.taxId && p.taxId.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [parties, activeTab, search]);

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !name) return;

    const newParty: Party = {
      id: `party_${Date.now()}`,
      type: activeTab,
      name,
      email,
      phone,
      taxId,
      billingAddress: {
        street1: street,
        city,
        state: gstState,
        postalCode: '400001',
        country,
      },
      notes,
      isArchived: false,
    };

    await TenantApi.saveParty(activeTenant.id, newParty);
    setModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setTaxId('');
    setStreet('');
    setCity('');
    setNotes('');
    await loadPartiesAndDocs();
  };

  const handleExportCsv = () => {
    const rows = [
      ['Name', 'Type', 'Email', 'Phone', 'Tax ID', 'Street', 'City', 'State', 'Country', 'Total Invoiced', 'Outstanding Balance'],
      ...filteredParties.map((p) => {
        const bal = customerBalances[p.name.trim().toLowerCase()] || { invoiced: 0, outstanding: 0 };
        return [
          p.name,
          p.type,
          p.email || '',
          p.phone || '',
          p.taxId || '',
          p.billingAddress?.street1 || '',
          p.billingAddress?.city || '',
          p.billingAddress?.state || '',
          p.billingAddress?.country || '',
          String(bal.invoiced),
          String(bal.outstanding),
        ];
      }),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab}s-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      ['Customer Name', 'Email Address', 'Phone Number', 'Tax ID / GSTIN', 'Street Address', 'City', 'State', 'Postal Code', 'Country', 'Notes'],
      ['Reliance Retail Ventures Ltd', 'accounts@relianceretail.in', '+91 9876543210', '27AAACR5055K1Z7', 'Plot 42, Bandra Kurla Complex', 'Mumbai', '27 - Maharashtra', '400051', 'India', 'Key Enterprise Account'],
      ['Tata Digital Pvt Ltd', 'billing@tatadigital.com', '+91 9820112233', '27AAACT2727Q1ZW', 'Bombay House, Homi Mody Street', 'Mumbai', '27 - Maharashtra', '400001', 'India', 'Net 30 Terms'],
      ['Global Tech Solutions Inc', 'ap@globaltech.io', '+1 4155552671', 'US-99-1234567', '500 Howard Street', 'San Francisco', 'CA', '94105', 'United States', 'USD Billing'],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'customer-import-sample-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const autoMapColumns = (headers: string[]) => {
    const nextMap: Record<CustomerFieldKey, string> = {
      name: '',
      email: '',
      phone: '',
      taxId: '',
      street1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      notes: '',
    };

    const matchHeader = (patterns: RegExp[]) =>
      headers.find((h) => patterns.some((rx) => rx.test(h.trim().toLowerCase()))) || '';

    nextMap.name = matchHeader([/^(customer|company|client|party)?\s*name$/i, /name/i, /organization/i]);
    nextMap.email = matchHeader([/e-?mail/i]);
    nextMap.phone = matchHeader([/phone|mobile|contact|tel/i]);
    nextMap.taxId = matchHeader([/gstin|gst|tax\s*id|vat|tin|pan/i]);
    nextMap.street1 = matchHeader([/street|address|line\s*1/i]);
    nextMap.city = matchHeader([/city|town/i]);
    nextMap.state = matchHeader([/state|province|region/i]);
    nextMap.postalCode = matchHeader([/postal|zip|pin\s*code|pincode/i]);
    nextMap.country = matchHeader([/country|nation/i]);
    nextMap.notes = matchHeader([/note|remark|comment/i]);

    setColumnMap(nextMap);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportResult(null);
    setRowActions({});

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx') {
        const buf = await file.arrayBuffer();
        const { headers, rows } = await parseXlsxBuffer(buf);
        setUploadedHeaders(headers);
        setUploadedRows(rows);
        autoMapColumns(headers);
      } else {
        const text = await file.text();
        // Check if it's an HTML table saved as .xls
        if (text.trim().startsWith('<table') || text.includes('<tr')) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const trs = Array.from(doc.querySelectorAll('tr'));
          const matrix = trs.map((tr) =>
            Array.from(tr.querySelectorAll('th,td')).map((td) => (td.textContent || '').trim())
          );
          if (matrix.length > 0) {
            const headers = matrix[0].map((h, i) => h || `Column_${i + 1}`);
            const rows = matrix.slice(1).map((r) => {
              const rec: Record<string, string> = {};
              headers.forEach((h, idx) => (rec[h] = r[idx] ?? ''));
              return rec;
            });
            setUploadedHeaders(headers);
            setUploadedRows(rows);
            autoMapColumns(headers);
            return;
          }
        }
        const { headers, rows } = parseCsvText(text);
        setUploadedHeaders(headers);
        setUploadedRows(rows);
        autoMapColumns(headers);
      }
    } catch (err: any) {
      alert(err?.message || 'Could not parse uploaded file. Please check the file format.');
    }
  };

  // Validate and detect duplicates on mapped rows
  const evaluatedImportRows: ParsedImportRow[] = useMemo(() => {
    const seenEmails = new Set<string>();
    const seenTaxIds = new Set<string>();
    const seenNames = new Set<string>();

    return uploadedRows.map((raw, idx) => {
      const rowNumber = idx + 2; // 1-based header + data row
      const getVal = (field: CustomerFieldKey) => {
        const col = columnMap[field];
        return col ? (raw[col] || '').trim() : '';
      };

      const mapped = {
        name: getVal('name'),
        email: getVal('email'),
        phone: getVal('phone'),
        taxId: getVal('taxId').toUpperCase(),
        street1: getVal('street1'),
        city: getVal('city'),
        state: getVal('state') || '27 - Maharashtra',
        postalCode: getVal('postalCode') || '400001',
        country: getVal('country') || 'India',
        notes: getVal('notes'),
      };

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!mapped.name) {
        errors.push('Customer Name is required');
      }
      if (mapped.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
        errors.push(`Invalid email "${mapped.email}"`);
      }
      if (mapped.phone && !/^[+\d\s\-().]{7,20}$/.test(mapped.phone)) {
        errors.push(`Invalid phone number "${mapped.phone}"`);
      }
      if (mapped.country && mapped.country.length < 2) {
        errors.push(`Invalid country "${mapped.country}"`);
      }
      if (mapped.taxId) {
        const isIndia = mapped.country.toLowerCase() === 'india' || mapped.country.toLowerCase() === 'in';
        if (isIndia && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(mapped.taxId)) {
          if (mapped.taxId.length < 5) {
            errors.push(`Invalid Tax ID / GSTIN "${mapped.taxId}"`);
          } else {
            warnings.push('Non-standard 15-char GSTIN format');
          }
        }
      }

      // Duplicate check against existing workspace parties
      let isDuplicate = false;
      let duplicateReason: string | undefined;

      const existingMatch = parties.find((p) => {
        if (p.type !== activeTab) return false;
        if (mapped.email && p.email && p.email.toLowerCase() === mapped.email.toLowerCase()) return true;
        if (mapped.taxId && p.taxId && p.taxId.toLowerCase() === mapped.taxId.toLowerCase()) return true;
        if (mapped.name && p.name.trim().toLowerCase() === mapped.name.toLowerCase()) return true;
        return false;
      });

      if (existingMatch) {
        isDuplicate = true;
        duplicateReason = `Matches existing ${activeTab} "${existingMatch.name}"`;
      } else {
        // Also check in-file duplicate
        if (mapped.email && seenEmails.has(mapped.email.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Duplicate email "${mapped.email}" within file`;
        } else if (mapped.taxId && seenTaxIds.has(mapped.taxId.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Duplicate Tax ID "${mapped.taxId}" within file`;
        } else if (mapped.name && seenNames.has(mapped.name.toLowerCase())) {
          isDuplicate = true;
          duplicateReason = `Duplicate name "${mapped.name}" within file`;
        }
      }

      if (mapped.email) seenEmails.add(mapped.email.toLowerCase());
      if (mapped.taxId) seenTaxIds.add(mapped.taxId.toLowerCase());
      if (mapped.name) seenNames.add(mapped.name.toLowerCase());

      return {
        rowNumber,
        raw,
        mapped,
        errors,
        warnings,
        isDuplicate,
        duplicateReason,
        rowAction: rowActions[rowNumber] || 'default',
      };
    });
  }, [uploadedRows, columnMap, parties, activeTab, rowActions]);

  const filteredImportRows = useMemo(() => {
    return evaluatedImportRows.filter((r) => {
      if (importFilter === 'errors') return r.errors.length > 0;
      if (importFilter === 'duplicates') return r.isDuplicate;
      if (importFilter === 'valid') return r.errors.length === 0 && !r.isDuplicate;
      return true;
    });
  }, [evaluatedImportRows, importFilter]);

  const handleExecuteImport = async () => {
    if (!activeTenant || evaluatedImportRows.length === 0) return;
    setImporting(true);
    setImportProgress(15);

    try {
      const preFailedErrors: Array<{ rowNumber: number; name: string; reason: string }> = [];
      const partiesToImport: Party[] = [];
      let manualSkipped = 0;

      evaluatedImportRows.forEach((r) => {
        if (r.errors.length > 0) {
          preFailedErrors.push({
            rowNumber: r.rowNumber,
            name: r.mapped.name || `(Row ${r.rowNumber})`,
            reason: r.errors.join('; '),
          });
          return;
        }
        const effectiveAction = r.rowAction === 'default' ? duplicateStrategy : r.rowAction;
        if (r.isDuplicate && effectiveAction === 'skip') {
          manualSkipped++;
          return;
        }
        partiesToImport.push({
          id: `party_${Date.now()}_${r.rowNumber}`,
          type: activeTab,
          name: r.mapped.name,
          email: r.mapped.email || undefined,
          phone: r.mapped.phone || undefined,
          taxId: r.mapped.taxId || undefined,
          billingAddress: {
            street1: r.mapped.street1 || '',
            city: r.mapped.city || '',
            state: r.mapped.state || '27 - Maharashtra',
            postalCode: r.mapped.postalCode || '400001',
            country: r.mapped.country || 'India',
          },
          notes: r.mapped.notes || undefined,
          isArchived: false,
        });
      });

      setImportProgress(60);
      const batchRes = await TenantApi.importPartiesBatch(
        activeTenant.id,
        partiesToImport,
        duplicateStrategy === 'skip' ? 'update' : duplicateStrategy
      );
      setImportProgress(100);

      setImportResult({
        created: batchRes.importedCount,
        updated: batchRes.updatedCount,
        skipped: batchRes.skippedCount + manualSkipped,
        failed: preFailedErrors.length,
        errors: preFailedErrors,
      });

      await loadPartiesAndDocs();
    } catch (err) {
      console.error('Failed customer import:', err);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadImportErrors = () => {
    if (!importResult || importResult.errors.length === 0) return;
    const rows = [
      ['Row Number', 'Customer Name', 'Error / Rejection Details'],
      ...importResult.errors.map((e) => [String(e.rowNumber), e.name, e.reason]),
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `customer-import-errors-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Customers
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage customer profiles, GST/tax registration numbers, billing addresses, and account balances ({tenantCurrency}).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportModalOpen(true);
                setImportResult(null);
              }}
              className="text-xs font-semibold flex items-center gap-1.5 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            >
              <Upload className="h-3.5 w-3.5" /> Import Customers
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Add {activeTab === 'customer' ? 'Customer' : 'Vendor'}
            </Button>
          </div>
        </div>

        {/* Tab switcher & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('customer')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'customer'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              Customers ({parties.filter((p) => p.type === 'customer').length})
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${
                activeTab === 'vendor'
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              Vendors ({parties.filter((p) => p.type === 'vendor').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder={`Search ${activeTab}s by name, email, or GSTIN...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Parties Grid */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">Loading customers...</div>
        ) : filteredParties.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              No {activeTab}s added yet
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
              Add customer contact and tax details or import from CSV / Excel to populate invoices automatically.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Import CSV / Excel
              </Button>
              <Button
                size="sm"
                onClick={() => setModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs"
              >
                Add First {activeTab === 'customer' ? 'Customer' : 'Vendor'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.map((p) => {
              const bal = customerBalances[p.name.trim().toLowerCase()] || {
                invoiced: 0,
                outstanding: 0,
                count: 0,
              };
              return (
                <Link key={p.id} href={`/dashboard/parties/${p.id}`} className="block group">
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 group-hover:border-primary group-hover:shadow-md transition-all cursor-pointer">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                            {p.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {bal.count} {bal.count === 1 ? 'invoice' : 'invoices'} • View Profile →
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {p.type}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {p.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </div>
                        )}
                        {p.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>{p.phone}</span>
                          </div>
                        )}
                        {p.taxId && (
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <span>Tax ID / GSTIN: {p.taxId}</span>
                          </div>
                        )}
                        {p.billingAddress?.street1 && (
                          <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                            <span>
                              {[
                                p.billingAddress.street1,
                                p.billingAddress.city,
                                p.billingAddress.state,
                                p.billingAddress.country,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Customer Financial Summary in Selected Workspace Currency */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 bg-slate-50/70 dark:bg-slate-950/70 -mx-5 -mb-5 p-3.5 rounded-b-xl">
                        <div>
                          <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block">
                            Total Invoiced
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            {formatCurrency(bal.invoiced, tenantCurrency)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 block">
                            Outstanding Balance
                          </span>
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              bal.outstanding > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {formatCurrency(bal.outstanding, tenantCurrency)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Modal: Add Customer / Vendor */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleCreateParty}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      Add New {activeTab === 'customer' ? 'Customer' : 'Vendor'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Customer / Company Name *
                      </label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Reliance Retail Ventures Ltd"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="accounts@company.in"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Phone Number
                      </label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          GSTIN / Tax ID
                        </label>
                        <Input
                          value={taxId}
                          onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                          placeholder="27AAACR5055K1Z7"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          GST State / Region
                        </label>
                        <select
                          value={gstState}
                          onChange={(e) => setGstState(e.target.value)}
                          className="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st.code} value={st.label}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Street Address
                        </label>
                        <Input
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="Plot 42, MIDC"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          City
                        </label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Mumbai"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Country
                      </label>
                      <Input
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="India"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white font-semibold"
                    >
                      Save {activeTab === 'customer' ? 'Customer' : 'Vendor'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Modal: Import Customers (CSV & Excel) */}
        {importModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-4xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl my-8 max-h-[92vh] flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Import Customers from CSV or Excel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload a CSV or Excel (.xlsx, .xls) file, map columns, review validation and duplicate checks, and import into {activeTenant?.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Step 1: Upload & Sample Template */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      1. Select CSV or Excel File (.csv, .xlsx, .xls)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Need a starting file? Download our pre-formatted sample template with required headers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSampleTemplate}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Sample Template
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls,.tsv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" /> Choose File
                    </Button>
                  </div>
                </div>

                {importFileName && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-lg">
                    <span>
                      Loaded file: <strong className="text-slate-900 dark:text-slate-100">{importFileName}</strong> ({uploadedRows.length} rows detected)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setImportFileName('');
                        setUploadedHeaders([]);
                        setUploadedRows([]);
                        setImportResult(null);
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                    >
                      Clear File
                    </button>
                  </div>
                )}

                {/* Step 2: Column Mapping & Duplicate Handling */}
                {uploadedHeaders.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        2. Map Uploaded Columns to Customer Fields
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          When duplicate customer is detected:
                        </label>
                        <select
                          value={duplicateStrategy}
                          onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                          className="h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <option value="skip">Skip duplicate records</option>
                          <option value="update">Update existing customer</option>
                          <option value="import">Import as new record anyway</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                      {CUSTOMER_FIELDS.map((field) => (
                        <div key={field.key}>
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={columnMap[field.key]}
                            onChange={(e) =>
                              setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            className="w-full h-8 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-2 text-xs"
                          >
                            <option value="">-- Ignore / Unmapped --</option>
                            {uploadedHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Preview & Validation Table */}
                {evaluatedImportRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        3. Preview & Validate Records ({evaluatedImportRows.length} total)
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setImportFilter('all')}
                          className={`px-2.5 py-1 rounded-md font-semibold ${
                            importFilter === 'all'
                              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          All ({evaluatedImportRows.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportFilter('valid')}
                          className={`px-2.5 py-1 rounded-md font-semibold ${
                            importFilter === 'valid'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          Ready ({evaluatedImportRows.filter((r) => r.errors.length === 0 && !r.isDuplicate).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportFilter('duplicates')}
                          className={`px-2.5 py-1 rounded-md font-semibold ${
                            importFilter === 'duplicates'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          Duplicates ({evaluatedImportRows.filter((r) => r.isDuplicate).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportFilter('errors')}
                          className={`px-2.5 py-1 rounded-md font-semibold ${
                            importFilter === 'errors'
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                          }`}
                        >
                          Invalid ({evaluatedImportRows.filter((r) => r.errors.length > 0).length})
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Row</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Email / Phone</th>
                            <th className="py-2 px-3">Tax ID / Country</th>
                            <th className="py-2 px-3">Validation / Status</th>
                            <th className="py-2 px-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredImportRows.slice(0, 100).map((row) => (
                            <tr key={row.rowNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 font-mono text-slate-400 dark:text-slate-500">#{row.rowNumber}</td>
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                {row.mapped.name || <span className="text-red-500 italic">Missing</span>}
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                <div>{row.mapped.email || '—'}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">{row.mapped.phone}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                                <div className="font-mono text-[11px]">{row.mapped.taxId || '—'}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">{row.mapped.country}</div>
                              </td>
                              <td className="py-2 px-3">
                                {row.errors.length > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
                                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                                    {row.errors.join(', ')}
                                  </span>
                                ) : row.isDuplicate ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                    {row.duplicateReason}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                    Valid
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {row.errors.length > 0 ? (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Will Fail
                                  </Badge>
                                ) : (
                                  <select
                                    value={row.rowAction}
                                    onChange={(e) =>
                                      setRowActions((prev) => ({
                                        ...prev,
                                        [row.rowNumber]: e.target.value as any,
                                      }))
                                    }
                                    className="h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 px-1.5 text-[11px]"
                                  >
                                    <option value="default">
                                       Default ({row.isDuplicate ? duplicateStrategy : 'import'})
                                    </option>
                                    <option value="import">Import New</option>
                                    <option value="update">Update Existing</option>
                                    <option value="skip">Skip Row</option>
                                  </select>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Progress Bar */}
                {importing && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                      <span>Importing customers into workspace...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 4: Import Summary & Error Report */}
                {importResult && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Customer Import Complete
                      </h4>
                      {importResult.errors.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadImportErrors}
                          className="text-xs border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" /> Download Error Details ({importResult.errors.length})
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                          Created
                        </span>
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                          {importResult.created}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                          Updated
                        </span>
                        <span className="text-lg font-black text-blue-700 dark:text-blue-400">
                          {importResult.updated}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                          Skipped
                        </span>
                        <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                          {importResult.skipped}
                        </span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-[10px] font-bold uppercase text-red-600 dark:text-red-400 block">
                          Failed
                        </span>
                        <span className="text-lg font-black text-red-700 dark:text-red-400">
                          {importResult.failed}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0 bg-slate-50 dark:bg-slate-950 rounded-b-xl">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImportModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={evaluatedImportRows.length === 0 || importing}
                  onClick={handleExecuteImport}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" /> Import {evaluatedImportRows.length} Records
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
