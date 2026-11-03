import Link from 'next/link';
import { FileText } from 'lucide-react';
import { APP_CONFIG } from '@invoice/core';

const GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Invoice generator', href: '/create' },
      { label: 'Templates', href: '/templates' },
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border py-10 text-sm text-muted-foreground">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
            {APP_CONFIG.brandName}
          </Link>
          <p className="mt-2">Invoices for businesses in any country.</p>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <div className="font-medium text-foreground">{group.title}</div>
            <ul className="mt-2 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-border px-4 pt-6 sm:px-6">
        © {new Date().getFullYear()} {APP_CONFIG.brandName}. All rights reserved.
      </div>
    </footer>
  );
}
