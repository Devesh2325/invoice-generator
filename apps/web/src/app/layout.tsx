import type { Metadata } from 'next';
import './globals.css';

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
        {children}
      </body>
    </html>
  );
}
