'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/lib/auth/tenant-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Palette,
  Shield,
  Settings,
  Plus,
  LogOut,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

interface TenantLayoutProps {
  children: React.ReactNode;
}

export const TenantLayout: React.FC<TenantLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { activeTenant, tenants, setActiveTenant, user, signOut } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', href: '/dashboard/documents', icon: FileText },
    { label: 'Customers & Vendors', href: '/dashboard/parties', icon: Users },
    { label: 'Products & Services', href: '/dashboard/products', icon: Package },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Brand Studio', href: '/dashboard/brand', icon: Palette },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-black text-lg text-primary tracking-tight">BillCraft</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-4">
          {/* Logo & App Brand */}
          <div className="flex items-center justify-between px-2 pt-1 pb-3 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-black text-xl text-primary tracking-tight">BillCraft</span>
            </Link>
            <Badge variant="outline" className="text-[10px] text-slate-500 font-mono">
              SaaS
            </Badge>
          </div>

          {/* Active Workspace Switcher */}
          <div className="relative">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 block mb-1">
              Active Workspace
            </label>
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between transition-all"
            >
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {activeTenant?.name || 'Select Workspace'}
                </div>
                <div className="text-[10px] text-slate-500 capitalize">
                  Role: {activeTenant?.role || 'Member'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-1 space-y-1">
                {tenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTenant(t);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                      activeTenant?.id === t.id
                        ? 'bg-blue-50 text-primary font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{t.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contextual Create Document CTA */}
          <div className="pt-1">
            <Link href="/create" className="block">
              <Button size="sm" className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" /> New Document
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
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-bold text-slate-800 truncate">
                {user?.name || 'Admin User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
            <button
              onClick={signOut}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main View Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {children}
      </div>
    </div>
  );
};
