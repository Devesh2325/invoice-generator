'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  FilePlus,
  Files,
  Users,
  Package,
  CreditCard,
  Settings,
  Sun,
  Moon,
  LifeBuoy,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Dialog, DialogContent } from './dialog';
import { useTheme } from '@/lib/theme/theme-provider';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { toggleTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'create-inv',
      title: 'Create New Invoice',
      category: 'Actions',
      icon: FilePlus,
      action: () => router.push('/create?type=invoice'),
      shortcut: 'N',
    },
    {
      id: 'create-po',
      title: 'Create Purchase Order (PO)',
      category: 'Actions',
      icon: FilePlus,
      action: () => router.push('/create?type=purchase_order'),
    },
    {
      id: 'create-est',
      title: 'Create Estimate / Quote',
      category: 'Actions',
      icon: FilePlus,
      action: () => router.push('/create?type=estimate'),
    },
    {
      id: 'nav-docs',
      title: 'View Invoices & Documents',
      category: 'Navigation',
      icon: Files,
      action: () => router.push('/dashboard/documents'),
    },
    {
      id: 'nav-customers',
      title: 'Manage Customers & Vendors',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/dashboard/parties'),
    },
    {
      id: 'nav-products',
      title: 'Products & Services Catalog',
      category: 'Navigation',
      icon: Package,
      action: () => router.push('/dashboard/products'),
    },
    {
      id: 'nav-payments',
      title: 'Payments & Refunds Ledger',
      category: 'Navigation',
      icon: CreditCard,
      action: () => router.push('/dashboard/payments'),
    },
    {
      id: 'nav-settings',
      title: 'Workspace Settings & Bank Details',
      category: 'Navigation',
      icon: Settings,
      action: () => router.push('/dashboard/settings'),
    },
    {
      id: 'nav-team',
      title: 'Team Members & Permissions',
      category: 'Navigation',
      icon: Users,
      action: () => router.push('/dashboard/team'),
    },
    {
      id: 'nav-billing',
      title: 'Plans & Billing',
      category: 'Navigation',
      icon: CreditCard,
      action: () => router.push('/dashboard/billing'),
    },
    {
      id: 'nav-admin',
      title: 'Super Admin Panel',
      category: 'Admin',
      icon: ShieldAlert,
      action: () => router.push('/admin'),
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
    {
      id: 'nav-faq',
      title: 'Help & FAQ Documentation',
      category: 'Support',
      icon: LifeBuoy,
      action: () => router.push('/faq'),
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-xl border-border bg-card shadow-2xl">
        <div className="flex items-center border-b border-border px-3.5">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, screen, or action... (e.g. Create, Settings, Theme)"
            className="h-12 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-hidden"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs text-foreground hover:bg-accent/60 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border px-3 py-2 bg-muted/40 text-[11px] text-muted-foreground flex justify-between items-center">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">Cmd + K / Ctrl + K</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};
