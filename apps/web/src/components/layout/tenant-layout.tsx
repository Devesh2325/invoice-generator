'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs, BreadcrumbItem } from '@/components/ui/breadcrumbs';
import { NotificationCenter } from '@/components/ui/notification-center';
import { PlanBadge } from '@/components/ui/plan-badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTheme } from '@/lib/theme/theme-provider';
import { APP_CONFIG } from '@invoice/core';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Palette,
  Settings,
  Plus,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  UserCheck,
  Shield,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export const TenantLayout: React.FC<TenantLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { activeTenant, brandSettings, tenants, setActiveTenant, tenantCurrency, user, signOut } = useTenant();
  const { toggleTheme, resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const isWhiteLabel = Boolean(activeTenant?.isWhiteLabel || brandSettings?.whiteLabelEnabled);
  const brandName = isWhiteLabel
    ? brandSettings?.businessName || activeTenant?.name || 'Workspace Studio'
    : APP_CONFIG.brandName;

  useEffect(() => {
    document.title = isWhiteLabel
      ? `${brandSettings?.businessName || activeTenant?.name} — Invoicing Studio`
      : `${APP_CONFIG.brandName} — Financial Operations & Invoicing`;
  }, [isWhiteLabel, brandSettings?.businessName, activeTenant?.name]);

  const navLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Invoices', href: '/dashboard/documents', icon: FileText },
    { label: 'Customers', href: '/dashboard/parties', icon: Users },
    { label: 'Products & Inventory', href: '/dashboard/products', icon: Package },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Brand Studio', href: '/dashboard/brand', icon: Palette },
    { label: 'Team', href: '/dashboard/team', icon: UserCheck },
    { label: 'Plans & Billing', href: '/dashboard/billing', icon: Shield },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  // Dynamic Breadcrumb generation
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname || pathname === '/dashboard') return [];
    if (pathname === '/dashboard/documents') return [{ label: 'Invoices' }];
    if (pathname === '/dashboard/parties') return [{ label: 'Customers' }];
    if (pathname.startsWith('/dashboard/parties/')) {
      return [{ label: 'Customers', href: '/dashboard/parties' }, { label: 'Customer Profile' }];
    }
    if (pathname === '/dashboard/products') return [{ label: 'Products & Inventory' }];
    if (pathname === '/dashboard/payments') return [{ label: 'Payments' }];
    if (pathname === '/dashboard/reports') return [{ label: 'Reports' }];
    if (pathname === '/dashboard/brand') return [{ label: 'Brand Studio' }];
    if (pathname === '/dashboard/team') return [{ label: 'Team' }];
    if (pathname === '/dashboard/billing') return [{ label: 'Plans & Billing' }];
    if (pathname === '/dashboard/settings') return [{ label: 'Settings' }];
    if (pathname.startsWith('/edit/')) {
      return [
        { label: 'Invoices', href: '/dashboard/documents' },
        { label: 'Edit Invoice' },
      ];
    }
    const segment = pathname.split('/').filter(Boolean).pop() || '';
    return [{ label: segment.charAt(0).toUpperCase() + segment.slice(1) }];
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 min-w-0">
          {brandSettings?.logoUrl ? (
            <img
              src={brandSettings.logoUrl}
              alt={brandName}
              className="h-6 w-auto max-w-[90px] object-contain rounded"
            />
          ) : (
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
          )}
          <span className="font-black text-lg text-primary tracking-tight truncate">
            {brandName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PlanBadge />
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Logo & App Brand */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Link href="/" className="flex items-center gap-2 min-w-0">
              {brandSettings?.logoUrl ? (
                <img
                  src={brandSettings.logoUrl}
                  alt={brandName}
                  className="h-7 w-auto max-w-[120px] object-contain rounded shrink-0"
                />
              ) : (
                <Sparkles className="h-6 w-6 text-primary shrink-0" />
              )}
              <span className="font-black text-lg text-primary tracking-tight truncate">
                {brandName}
              </span>
            </Link>
            <Badge variant="outline" className="text-[10px] text-slate-600 dark:text-slate-400 font-mono shrink-0">
              {tenantCurrency}
            </Badge>
          </div>

          {/* Active Workspace Switcher */}
          <div className="relative">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
              Active Workspace
            </label>
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between transition-all"
            >
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {activeTenant?.name || 'Select Workspace'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  Role: {activeTenant?.role || 'Owner'} • {tenantCurrency}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 p-1 space-y-1">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTenant(t);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                      activeTenant?.id === t.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-primary font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{t.currency || 'INR'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Create Invoice CTA */}
          <div className="pt-1">
            <Link href="/create" className="block">
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> Create Invoice
              </Button>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 pt-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                {user?.name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Header Bar for Desktop */}
        <header className="hidden md:flex h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 items-center justify-between shrink-0 sticky top-0 z-30">
          <Breadcrumbs items={getBreadcrumbs()} />

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={handleOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search actions...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Active Plan Badge or Upgrade Icon */}
            <PlanBadge />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
