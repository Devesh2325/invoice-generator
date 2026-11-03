'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  BookOpen,
  Palette,
  Building,
  History,
  LogOut,
  ExternalLink,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/lib/theme/theme-provider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Access is enforced on the server by src/middleware.ts.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users & Subscriptions', icon: Users },
    { href: '/admin/plans', label: 'Plan Limits & Pricing', icon: CreditCard },
    { href: '/admin/inquiries', label: 'Inquiries Inbox', icon: MessageSquare },
    { href: '/admin/blog', label: 'Blog & Content Manager', icon: BookOpen },
    { href: '/admin/templates', label: 'Template Manager', icon: Palette },
    { href: '/admin/teams', label: 'Teams & Workspaces', icon: Building },
    { href: '/admin/audit', label: 'System Audit Logs', icon: History },
  ];

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="sticky top-0 z-40 w-full md:h-screen md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col justify-between shrink-0">
        <div className="md:overflow-y-auto">
          <div className="px-4 py-3 md:p-5 border-b border-border flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 font-semibold text-base text-foreground tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span>Super Admin</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg text-foreground hover:bg-accent"
              aria-label={menuOpen ? 'Close admin menu' : 'Open admin menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <nav className={`${menuOpen ? 'block' : 'hidden'} md:block p-3 space-y-1`} aria-label="Admin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} md:block p-4 border-t border-border space-y-2`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full text-sm text-muted-foreground hover:text-foreground justify-start"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-3.5 w-3.5 mr-2" /> : <Moon className="h-3.5 w-3.5 mr-2" />}
            {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
          </Button>
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="w-full text-sm text-muted-foreground hover:text-foreground justify-start">
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Public Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-sm text-rose-700 dark:text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 justify-start"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 bg-background">
        {children}
      </main>
    </div>
  );
}
