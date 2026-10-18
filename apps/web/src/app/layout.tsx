import type { Metadata, Viewport } from 'next';
import './globals.css';
import { APP_CONFIG } from '@invoice/core';
import { TenantProvider } from '@/lib/auth/tenant-context';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/ui/command-palette';

export const metadata: Metadata = {
  title: `${APP_CONFIG.brandName} — Modern Invoice & Inventory Studio`,
  description:
    `Production-ready SaaS for creating Invoices, Purchase Orders & Estimates with decimal-safe calculations, multi-tenant white-label workspaces, and UPI payment rails.`,
  keywords: [
    'invoice generator',
    'gst invoice',
    'purchase order',
    'estimate generator',
    'upi payment qr',
    'saas billing',
    'pdf invoice',
  ],
  authors: [{ name: `${APP_CONFIG.brandName} Team` }],
  metadataBase: new URL(`https://${APP_CONFIG.brandDomain}`),
  openGraph: {
    title: `${APP_CONFIG.brandName} — Modern Invoice & Inventory Studio`,
    description:
      'Fast, modern, decimal-safe invoicing with GST compliance, scannable UPI QR codes, and 8+ designer templates.',
    url: `https://${APP_CONFIG.brandDomain}`,
    siteName: APP_CONFIG.brandName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.brandName} — Modern Invoice Studio`,
    description: 'Fast, modern, decimal-safe invoicing with GST compliance and designer templates.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/ahdjs/build/css/index.css" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>
          <I18nProvider>
            <TenantProvider>
              {children}
              <CommandPalette />
              <Toaster />
            </TenantProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
