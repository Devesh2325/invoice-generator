'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AdminApi } from '@invoice/api';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  CreditCard,
  MessageSquare,
  BookOpen,
  Palette,
  Building,
  Settings,
  History,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // If on /admin/login, don't protect
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    if (!AdminApi.isAuthenticated()) {
      router.push('/admin/login');
    } else {
      setAuthorized(true);
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Verifying Super Admin Authorization...
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users & Subscriptions', icon: Users },
    { href: '/admin/plans', label: 'Plan Limits & Pricing', icon: CreditCard },
    { href: '/admin/inquiries', label: 'Inquiries Inbox', icon: MessageSquare },
    { href: '/admin/blog', label: 'Blog & Content Manager', icon: BookOpen },
    { href: '/admin/templates', label: 'Template Manager', icon: Palette },
    { href: '/admin/teams', label: 'Teams & Workspaces', icon: Building },
    { href: '/admin/settings', label: 'Site Settings', icon: Settings },
    { href: '/admin/audit', label: 'System Audit Logs', icon: History },
  ];

  const handleLogout = () => {
    AdminApi.logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5 font-black text-base text-white tracking-tight">
              <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span>Super Admin</span>
            </Link>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/" target="_blank">
            <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-white justify-start">
              <ExternalLink className="h-3.5 w-3.5 mr-2" /> View Public Site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 justify-start"
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}
