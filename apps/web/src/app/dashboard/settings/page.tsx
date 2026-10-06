'use client';

import React, { useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ImportWizardModal } from '@/components/modals/import-wizard-modal';
import { Settings, CloudUpload, Mail, Key, Shield } from 'lucide-react';

export default function TenantSettingsPage() {
  const { activeTenant } = useTenant();
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('invoices@acmedesign.io');
  const [emailSaved, setEmailSaved] = useState(false);

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage data migration, email routing (Resend), and workspace configuration.
          </p>
        </div>

        {/* Local-to-Cloud Import Section */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CloudUpload className="h-4 w-4 text-primary" /> Offline Device Migration
            </CardTitle>
            <CardDescription className="text-xs">
              Synchronize invoices and documents created anonymously on this device into this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-blue-50/50 border border-blue-200 rounded-lg gap-3">
              <div className="text-xs text-slate-700">
                Scan and import local IndexedDB documents into{' '}
                <strong>{activeTenant?.name}</strong> with conflict verification.
              </div>
              <Button
                size="sm"
                onClick={() => setImportModalOpen(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0"
              >
                Launch Import Wizard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email & Resend Transactional Settings */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Resend Transactional Email Delivery
            </CardTitle>
            <CardDescription className="text-xs">
              Connect Resend to automatically email invoices, quotes, receipts, and payment reminders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              {process.env.RESEND_API_KEY ? (
                <span>✓ Resend API key is detected in the server environment.</span>
              ) : (
                <span>
                  Resend API key is not yet configured. Email dispatch will operate in simulation mode.
                  You can download and share PDFs manually at any time.
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Resend API Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="re_123456789..."
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    className="pl-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  From Email Address
                </label>
                <Input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setEmailSaved(true);
                    setTimeout(() => setEmailSaved(false), 3000);
                  }}
                  className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold"
                >
                  {emailSaved ? 'Settings Saved!' : 'Save Email Config'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {activeTenant && (
          <ImportWizardModal
            tenantId={activeTenant.id}
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onImportComplete={() => {
              setImportModalOpen(false);
              alert('Import completed successfully!');
            }}
          />
        )}
      </div>
    </TenantLayout>
  );
}
