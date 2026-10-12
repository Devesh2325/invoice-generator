import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TenantProvider } from '@/lib/auth/tenant-context';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/ui/command-palette';

export const metadata: Metadata = {
  title: 'BillCraft — Professional Invoice, PO & Estimate Studio',
  description:
    'Production-ready SaaS for creating Invoices, Purchase Orders & Estimates with decimal-safe calculations, 8+ structural templates, UPI QR codes, and multi-tenant teams.',
  keywords: [
    'invoice generator',
    'gst invoice',
    'purchase order',
    'estimate generator',
    'upi payment qr',
    'saas billing',
    'pdf invoice',
  ],
  authors: [{ name: 'BillCraft Team' }],
  metadataBase: new URL('https://billcraft.io'),
  openGraph: {
    title: 'BillCraft — Professional Invoice, PO & Estimate Studio',
    description:
      'Fast, modern, decimal-safe invoicing with GST compliance, scannable UPI QR codes, and 8+ designer templates.',
    url: 'https://billcraft.io',
    siteName: 'BillCraft',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BillCraft — Professional Invoice Studio',
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
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <ThemeProvider>
          <TenantProvider>
            {children}
            <CommandPalette />
            <Toaster />
          </TenantProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
