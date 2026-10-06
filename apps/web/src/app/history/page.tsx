'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  getAllDocuments,
  deleteDocument,
  saveDocument,
  exportLocalDataJson,
  importLocalDataJson,
} from '@/lib/storage/indexed-db';
import { DocumentModel, formatCurrency, DEFAULT_NUMBERING_RULES, formatDocumentNumber } from '@invoice/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Plus,
  Search,
  Download,
  Trash2,
  Copy,
  Edit,
  Upload,
  Sparkles,
  ArrowLeft,
  Calendar,
  User,
  CheckCircle2,
} from 'lucide-react';

export default function DocumentHistoryPage() {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const refreshDocuments = async () => {
    try {
      const all = await getAllDocuments();
      setDocuments(all);
    } catch (e) {
      console.error('Failed to load documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDocuments();
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        search === '' ||
        doc.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
        doc.client.name.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'all' || doc.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, search, typeFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this document from device storage?')) {
      await deleteDocument(id);
      await refreshDocuments();
    }
  };

  const handleDuplicate = async (doc: DocumentModel) => {
    const newDoc: DocumentModel = {
      ...doc,
      id: `doc_${Date.now()}`,
      documentNumber: formatDocumentNumber(
        DEFAULT_NUMBERING_RULES[doc.type],
        Math.floor(Math.random() * 9000) + 1000
      ),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveDocument(newDoc);
    await refreshDocuments();
  };

  const handleExportJson = async () => {
    const jsonStr = await exportLocalDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billcraft-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importLocalDataJson(content);
      if (res.error) {
        setImportStatus(`Import failed: ${res.error}`);
      } else {
        setImportStatus(`Successfully imported ${res.importedCount} documents!`);
        await refreshDocuments();
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> Local Document History
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-700">
              <Upload className="h-3.5 w-3.5" /> Restore Backup
            </span>
          </label>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" /> Backup JSON
          </Button>

          <Link href="/create">
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-white flex items-center gap-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> New Document
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 space-y-6">
        {importStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {importStatus}
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by number, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Document Types</option>
              <option value="invoice">Invoices</option>
              <option value="estimate">Estimates / Quotes</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="receipt">Receipts</option>
              <option value="credit_note">Credit Notes</option>
              <option value="pro_forma">Pro Forma</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading saved documents...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-blue-50 text-primary mx-auto flex items-center justify-center">
              <FileText className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Documents Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              You haven't saved any documents matching this filter in your device storage yet.
            </p>
            <Link href="/create" className="inline-block pt-2">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-white">
                Create First Document
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="border-slate-200 hover:shadow-sm transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {doc.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">
                        {doc.documentNumber}
                      </h4>
                    </div>
                    <Badge
                      variant={
                        doc.status === 'paid'
                          ? 'success'
                          : doc.status === 'finalized'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {doc.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{doc.client.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Issued: {doc.issueDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">Total</span>
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(doc.summary.grandTotal, doc.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-2">
                    <Link href={`/edit/${doc.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs">
                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(doc)}
                      className="h-8 px-2.5 text-xs"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
