'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDocumentById } from '@/lib/storage/indexed-db';
import { TenantApi } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { DocumentModel } from '@invoice/core';
import { DocumentBuilder } from '@/components/document/document-builder';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EditInvoicePage() {
  const params = useParams();
  const { activeTenant } = useTenant();
  const id = params?.id as string;

  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        let doc = await getDocumentById(id);
        if (!doc && activeTenant?.id) {
          doc = await TenantApi.getDocumentById(activeTenant.id, id);
        }
        setDocument(doc);
      } catch (err) {
        console.error('Error fetching invoice from storage:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, activeTenant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <span className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-xl font-bold">Invoice Not Found</h2>
          <p className="text-sm text-slate-500">
            The requested invoice could not be found in your workspace or device storage.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/create">
              <Button size="sm">Create Invoice</Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button size="sm" variant="outline">
                Back to Invoices
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <DocumentBuilder initialDocument={document} />;
}
