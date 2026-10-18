'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_CONFIG } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { useTheme } from '@/lib/theme/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  ArrowRight,
  Layers,
  FileText,
  CreditCard,
  Building2,
  PlayCircle,
  HelpCircle,
  Globe,
} from 'lucide-react';

interface PublicHeaderProps {
  className?: string;
  hideNavLinks?: boolean;
}

export function PublicHeader({ className = '', hideNavLinks = false }: PublicHeaderProps) {
  const pathname = usePathname();
  const { brandSettings } = useTenant();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const brandName = brandSettings?.whiteLabelEnabled && brandSettings?.businessName
    ? brandSettings.businessName
    : APP_CONFIG.brandName;

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    {
      label: 'Demo',
      href: '/demo',
      badge: 'Sandbox',
    },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
  ];

  return (
    <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-colors ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-xl text-primary tracking-tight transition-transform hover:scale-105"
          >
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold">{brandName}</span>
          </Link>

          {/* Desktop Navigation - visible on md and up */}
          {!hideNavLinks && (
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-xs font-semibold text-muted-foreground">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg ${
                      isActive
                        ? 'text-primary font-bold bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link href="/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-xs font-bold">
              Sign In
            </Button>
          </Link>

          <Link href="/create">
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-sm flex items-center gap-1.5 rounded-xl"
            >
              <span>Start Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>

          {/* Mobile Menu Button - visible on small screens */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-accent font-semibold text-xs transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md px-4 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full text-xs font-bold justify-center rounded-xl">
                Sign In to Account
              </Button>
            </Link>
            <Link href="/create" onClick={() => setMobileOpen(false)}>
              <Button className="w-full bg-primary text-primary-foreground text-xs font-bold justify-center rounded-xl">
                Create Invoice Free
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
