import type { Metadata } from 'next';
import './globals.css';
import { TenantProvider } from '@/lib/auth/tenant-context';

export const metadata: Metadata = {
  title: 'BillCraft — Production-Ready Invoice Generator',
  description:
    'Free, privacy-first, multi-tenant invoice generator with decimal-safe calculations, 8 professional templates, and offline IndexedDB persistence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <TenantProvider>{children}</TenantProvider>
      </body>
    </html>
  );
}
