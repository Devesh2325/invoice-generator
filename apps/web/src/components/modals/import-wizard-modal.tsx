'use client';

import React, { useState, useEffect } from 'react';
import { getAllDocuments, deleteDocument } from '@/lib/storage/indexed-db';
import { TenantApi } from '@invoice/api';
import { DocumentModel, formatCurrency } from '@invoice/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CloudUpload, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface ImportWizardModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  tenantId,
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [localDocs, setLocalDocs] = useState<DocumentModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [existingTenantDocs, setExistingTenantDocs] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    async function inspect() {
      setLoading(true);
      try {
        const local = await getAllDocuments();
        const cloud = await TenantApi.getDocuments(tenantId);
        setLocalDocs(local);
        setExistingTenantDocs(cloud);
        // Default select all non-duplicates
        const cloudNumbers = new Set(cloud.map((d) => d.documentNumber));
        const initialSelected = new Set(
          local.filter((d) => !cloudNumbers.has(d.documentNumber)).map((d) => d.id)
        );
        setSelectedIds(initialSelected);
      } catch (e) {
        console.error('Failed to load local documents for import:', e);
      } finally {
        setLoading(false);
      }
    }
    inspect();
  }, [isOpen, tenantId]);

  if (!isOpen) return null;

  const cloudNumbers = new Set(existingTenantDocs.map((d) => d.documentNumber));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    let successCount = 0;

    try {
      for (const doc of localDocs) {
        if (selectedIds.has(doc.id)) {
          const tenantScopedDoc: DocumentModel = {
            ...doc,
            tenantId,
            updatedAt: new Date().toISOString(),
          };
          await TenantApi.saveDocument(tenantId, tenantScopedDoc);
          successCount++;
        }
      }

      setImportedCount(successCount);
      setImportSuccess(true);
      onImportComplete();
    } catch (err) {
      console.error('Import transfer failed:', err);
      alert('An error occurred during transfer. You can retry safely.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-xl bg-white border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start border-b pb-3">
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-primary" />
                Local-to-Cloud Migration Wizard
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Explicitly review and transfer offline IndexedDB documents into your tenant workspace.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {importSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-base text-slate-900">
                Migration Successfully Completed!
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Verified and safely uploaded {importedCount} documents to your active workspace.
                Your local device copies remain intact.
              </p>
              <Button size="sm" onClick={onClose} className="mt-2 text-xs">
                Back to Dashboard
              </Button>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Scanning local device storage...
            </div>
          ) : localDocs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No offline documents detected in this browser's IndexedDB.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                Found <strong>{localDocs.length}</strong> local document(s). Select the records
                you wish to synchronize to this workspace.
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border rounded-lg">
                {localDocs.map((doc) => {
                  const isDuplicate = cloudNumbers.has(doc.documentNumber);
                  return (
                    <div
                      key={doc.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(doc.id)}
                          onChange={() => toggleSelect(doc.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div>
                          <div className="font-bold text-slate-900">
                            {doc.documentNumber} ({doc.client.name})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatCurrency(doc.summary.grandTotal, doc.currency)} • Issued {doc.issueDate}
                          </div>
                        </div>
                      </label>

                      {isDuplicate && (
                        <Badge variant="warning" className="text-[10px]">
                          Duplicate Number in Cloud
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="text-xs text-slate-500">
                  {selectedIds.size} of {localDocs.length} selected
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedIds.size === 0 || isImporting}
                    onClick={handleExecuteImport}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                  >
                    {isImporting ? 'Syncing...' : `Import ${selectedIds.size} Documents`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
