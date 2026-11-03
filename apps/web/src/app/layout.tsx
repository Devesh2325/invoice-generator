import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@invoice/core';
import { TenantProvider } from '@/lib/auth/tenant-context';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { Toaster } from '@/components/ui/toaster';
import { CommandPalette } from '@/components/ui/command-palette';
import { NavigationProgress } from '@/components/layout/navigation-progress';

const sans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: `${APP_CONFIG.brandName} — Invoice generator for every country`,
  description:
    'Create invoices, estimates and purchase orders with automatic GST, VAT or sales tax, in your currency, with PDF and Excel downloads.',
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
    title: `${APP_CONFIG.brandName} — Invoice generator for every country`,
    description:
      'Create invoices with automatic GST, VAT or sales tax, in your currency, with PDF and Excel downloads.',
    url: `https://${APP_CONFIG.brandDomain}`,
    siteName: APP_CONFIG.brandName,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_CONFIG.brandName} — Invoice generator for every country`,
    description: 'Create invoices with automatic GST, VAT or sales tax, in your currency, with PDF and Excel downloads.',
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
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Applies the saved theme before first paint, so pages don't flash the wrong one. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('billcraft_theme');if(t==='dark'||((t==='system'||!t)&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased text-foreground">
        <NavigationProgress />
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
