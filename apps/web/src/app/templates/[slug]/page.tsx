'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { TEMPLATES, getTemplate, DocumentTemplateMeta } from '@invoice/theme';
import { APP_CONFIG, isTemplateAllowedForPlan } from '@invoice/core';
import { PublicHeader } from '@/components/layout/public-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  ChevronRight,
  ArrowRight,
  Download,
  FileText,
  FileCode,
  Table,
  TableProperties,
  Sparkles,
  CheckCircle2,
  Lock,
  Printer,
  Shield,
  Layers,
} from 'lucide-react';

export default function TemplateDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const template = useMemo(() => {
    if (!slug) return null;
    const found = Object.values(TEMPLATES).find(
      (t) => t.id === slug || t.id.toLowerCase() === slug.toLowerCase()
    );
    return found || null;
  }, [slug]);

  if (!template) {
    // If not found in static, check if standard blank
    if (slug === 'blank' || slug === 'blank_invoice') {
      const blankMeta = TEMPLATES.modern;
      return <TemplateDetailView template={{ ...blankMeta, name: 'Blank Invoice Template', id: 'modern' }} />;
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
        <PublicHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <FileText className="h-12 w-12 text-slate-400" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Template Not Found</h1>
          <p className="text-sm text-slate-500 max-w-md">
            The template &quot;{slug}&quot; could not be found or has been archived.
          </p>
          <Link href="/templates">
            <Button className="bg-primary text-primary-foreground font-bold text-xs">
              Back to Free Templates
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <TemplateDetailView template={template} />;
}

function TemplateDetailView({ template }: { template: DocumentTemplateMeta }) {
  const isFree = isTemplateAllowedForPlan('starter', template.id);
  const primaryColor = template.defaultTokens.primaryColor || '#1D4ED8';

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadWord = () => {
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>${template.name}</title>
      <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: ${primaryColor}; color: #ffffff; padding: 8px; text-align: left; }
        td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
        .total { text-align: right; font-weight: bold; font-size: 14pt; }
      </style>
      </head>
      <body>
        <h1 style="color: ${primaryColor}; margin-bottom: 4px;">INVOICE</h1>
        <p><strong>Template:</strong> ${template.name} (${template.categoryLabel || 'Compliance'})</p>
        <p><strong>Invoice No:</strong> #INV-2026-001 | <strong>Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
        <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Professional Consulting & Service Retainer</td>
              <td style="text-align: right;">1</td>
              <td style="text-align: right;">8,500.00</td>
              <td style="text-align: right;">8,500.00</td>
            </tr>
            <tr>
              <td>Platform Setup & Infrastructure Implementation</td>
              <td style="text-align: right;">1</td>
              <td style="text-align: right;">3,950.00</td>
              <td style="text-align: right;">3,950.00</td>
            </tr>
          </tbody>
        </table>
        <p class="total" style="margin-top: 24px;">Total Amount: 12,450.00</p>
      </body>
      </html>
    `;
    downloadFile(`invoice-${template.id}.doc`, wordContent, 'application/msword');
  };

  const handleDownloadExcel = () => {
    const csvContent = `INVOICE\nTemplate,${template.name}\nInvoice No,#INV-2026-001\nDate,${new Date().toISOString().split('T')[0]}\n\nDescription,Quantity,Price,Amount\nProfessional Consulting & Retainer,1,8500.00,8500.00\nPlatform Infrastructure Implementation,1,3950.00,3950.00\n\nSubtotal,,,12450.00\nTotal Due,,,12450.00\n`;
    downloadFile(`invoice-${template.id}.csv`, csvContent, 'text/csv;charset=utf-8;');
  };

  const handleDownloadPdf = () => {
    window.location.href = `/create?template=${template.id}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 md:py-14 space-y-16 flex-1 w-full">
        {/* Breadcrumb matching Image 1 */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link
            href="/"
            className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <Link
            href="/templates"
            className="hover:text-primary transition-colors font-medium"
          >
            Invoice Templates
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {template.name}
          </span>
        </nav>

        {/* Hero Section matching Image 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Heading, description, actions */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold">
                  {template.categoryLabel || 'Invoice Template'}
                </Badge>
                {isFree ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    FREE TO USE
                  </Badge>
                ) : (
                  <Badge className="bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1">
                    <Lock className="h-3 w-3" /> PRO TEMPLATE
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                {template.name}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                {template.description ||
                  `Need a ${template.name.toLowerCase()} that you can customize to your business? Look no further. Our free invoice template gives you a clean canvas to add line items, change currencies, and customize taxes. You can send it directly to your clients, or print it out.`}
              </p>
            </div>

            {/* Action Buttons matching Image 1 */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href={`/create?template=${template.id}`}>
                <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3 rounded-full text-sm shadow-md transition-all cursor-pointer flex items-center gap-2">
                  <span>Fill it in online</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>

              <a
                href="#download-formats"
                className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors underline decoration-slate-400 dark:decoration-slate-600 underline-offset-4 flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>Download the template</span>
              </a>
            </div>

            {/* Key template features bullet points */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Auto-calculating totals</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Custom brand logo & colors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Universal currency support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>PDF, Word & Excel ready</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Preview Card matching Image 1 */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200/80 relative overflow-hidden transition-all">
              {/* Top Accent Strip */}
              <div
                className="h-2.5 w-full absolute top-0 left-0"
                style={{ backgroundColor: primaryColor }}
              />

              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4 pt-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
                      style={{ backgroundColor: primaryColor }}
                    >
                      ★
                    </div>
                    <span className="font-extrabold text-lg tracking-tight text-slate-900 uppercase">
                      INVOICE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">Your Business / Studio Name</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-slate-900">#INV-2026-001</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              {/* Billed To / From Addresses */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Billed To:
                  </span>
                  <div className="font-bold text-slate-800">Acme Corporation Inc.</div>
                  <div className="text-slate-500 text-[11px]">742 Evergreen Terrace</div>
                  <div className="text-slate-500 text-[11px]">billing@acme.com</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Invoice Details:
                  </span>
                  <div className="text-slate-600 text-[11px]">Due in 15 days</div>
                  <div className="text-slate-600 text-[11px]">PO: PO-98421</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2 py-2">
                <div
                  className="rounded-lg px-3 py-2 flex justify-between text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="w-1/2">Description</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/6 text-right">Price</span>
                  <span className="w-1/6 text-right">Amount</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs text-slate-700 px-1">
                  <div className="py-2 flex justify-between items-center">
                    <span className="w-1/2 font-medium">Design Retainer & Strategy</span>
                    <span className="w-1/6 text-right font-mono">1</span>
                    <span className="w-1/6 text-right font-mono">₹8,500</span>
                    <span className="w-1/6 text-right font-mono font-bold">₹8,500</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="w-1/2 font-medium">Cloud Infrastructure Setup</span>
                    <span className="w-1/6 text-right font-mono">1</span>
                    <span className="w-1/6 text-right font-mono">₹3,950</span>
                    <span className="w-1/6 text-right font-mono font-bold">₹3,950</span>
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-slate-200 pt-3 mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">₹12,450.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (0% / Exempt)</span>
                  <span className="font-mono">₹0.00</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total Amount Due</span>
                  <span className="font-mono" style={{ color: primaryColor }}>₹12,450.00</span>
                </div>
              </div>

              {/* Watermark / Footer note */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Payment due within 15 days</span>
                <span className="font-mono">Thank you for your business!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section matching Image 1 */}
        <section id="download-formats" className="space-y-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Download a free {template.name.toLowerCase()}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Our {template.name.toLowerCase()} is ready to use. Download now in Word, Google Docs, Excel, Google Sheets, or PDF.
            </p>
          </div>

          {/* 6 Download Format Cards in a 3x2 Grid matching Image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Microsoft Word */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Microsoft Word</h3>
                    <span className="text-[11px] font-mono text-slate-400">.docx format</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Clean, formatted invoice document with table borders ready for Microsoft Word desktop or Office 365.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadWord}
                className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .docx
              </Button>
            </div>

            {/* 2. Google Docs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-black">
                    <FileCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Google Docs</h3>
                    <span className="text-[11px] font-mono text-slate-400">Online Document</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct editable template document for Google Docs, Google Drive, and collaborative Workspace teams.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadWord}
                className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Open / Download for Docs
              </Button>
            </div>

            {/* 3. Microsoft Excel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    <Table className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Microsoft Excel</h3>
                    <span className="text-[11px] font-mono text-slate-400">.xlsx format</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Formula-based spreadsheet invoice with automatic item sum, price calculation, and tax breakdown.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadExcel}
                className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .xlsx
              </Button>
            </div>

            {/* 4. Google Sheets */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black">
                    <TableProperties className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Google Sheets</h3>
                    <span className="text-[11px] font-mono text-slate-400">Cloud Spreadsheet</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cloud spreadsheet template ready to import into Google Drive and Google Sheets with live formulas.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadExcel}
                className="w-full text-xs font-bold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Open in Google Sheets
              </Button>
            </div>

            {/* 5. PDF (US Letter) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">PDF (US Letter)</h3>
                    <span className="text-[11px] font-mono text-slate-400">8.5&quot; × 11&quot; printable</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  High-resolution vector PDF formatted for standard US Letter printers across North America.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                className="w-full text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Fill & Generate PDF
              </Button>
            </div>

            {/* 6. PDF (A4) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">PDF (A4)</h3>
                    <span className="text-[11px] font-mono text-slate-400">210mm × 297mm standard</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Global ISO 216 paper standard PDF for India, UK, European Union, and international clients.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Fill & Generate A4 PDF
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        © 2026 {APP_CONFIG.brandName} Template Studio. Professional financial layouts for modern businesses.
      </footer>
    </div>
  );
}
