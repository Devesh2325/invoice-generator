'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DocumentModel } from '@invoice/core';
import { TenantApi } from '@invoice/api';
import { useTenant } from '@/lib/auth/tenant-context';
import { getDocumentById } from '@/lib/storage/indexed-db';
import { DocumentBuilder } from '@/components/document/document-builder';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { activeTenant } = useTenant();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [document, setDocument] = useState<DocumentModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDoc() {
      if (!id) return;
      setLoading(true);

      try {
        // 1. Try local IndexedDB first
        const localDoc = await getDocumentById(id);
        if (localDoc && isMounted) {
          setDocument(localDoc);
          setLoading(false);
          return;
        }

        // 2. Try tenant API
        if (activeTenant?.id) {
          const tenantDocs = await TenantApi.getDocuments(activeTenant.id);
          const found = tenantDocs.find((d) => d.id === id);
          if (found && isMounted) {
            setDocument(found);
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load document for editing:', err);
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
      }
    }

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [id, activeTenant?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto pt-6">
          <Skeleton className="h-[500px] rounded-xl" />
          <Skeleton className="h-[500px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (notFound || !document) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Invoice Not Found</h1>
        <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
          The requested document could not be located in your active workspace or local storage. It may have been deleted or archived.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/documents">
            <Button variant="outline" size="sm" className="text-xs font-semibold">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Invoices
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm" className="text-xs font-semibold">
              Create New Invoice
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DocumentBuilder
      initialDocument={document}
      onSaved={(updated) => setDocument(updated)}
    />
  );
}
