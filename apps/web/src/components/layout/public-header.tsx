'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_CONFIG } from '@invoice/core';
import { useTenant } from '@/lib/auth/tenant-context';
import { useHostBrand } from '@/lib/platform/platform-provider';
import { useTheme } from '@/lib/theme/theme-provider';
import { useTranslation } from '@/lib/i18n/i18n-context';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { FileText, Menu, X, Sun, Moon } from 'lucide-react';

interface PublicHeaderProps {
  className?: string;
  hideNavLinks?: boolean;
}

export function PublicHeader({ className = '', hideNavLinks = false }: PublicHeaderProps) {
  const pathname = usePathname();
  const { brandSettings, user } = useTenant();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hostBrand = useHostBrand();
  const tenantLabel = Boolean(brandSettings?.whiteLabelEnabled && brandSettings?.businessName);
  const whiteLabel = tenantLabel || Boolean(hostBrand);
  const brandName = tenantLabel ? brandSettings!.businessName : hostBrand?.name || APP_CONFIG.brandName;
  const brandLogo = tenantLabel ? brandSettings?.logoUrl : hostBrand?.logoUrl;

  const navLinks = [
    { label: t('nav.features', 'Features'), href: '/features' },
    { label: 'Templates', href: '/templates' },
    { label: 'Integrations', href: '/integrations' },
    { label: 'White-label', href: '/white-label' },
    { label: t('nav.pricing', 'Pricing'), href: '/pricing' },
    { label: t('nav.faq', 'FAQ'), href: '/faq' },
    { label: t('nav.blog', 'Blog'), href: '/blog' },
  ];

  return (
    <header className={`sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl ${className}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            {whiteLabel && brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brandLogo} alt="" className="h-8 w-8 rounded-xl object-contain" />
            ) : (
              <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-xl text-white">
                <FileText className="h-4 w-4" />
              </span>
            )}
            <span>{brandName}</span>
          </Link>

          {!hideNavLinks && (
            <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Main">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={pathname === link.href ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 transition-colors ${
                    pathname === link.href
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Link
            href={user ? '/dashboard' : '/login'}
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:inline-flex"
          >
            {user ? 'Dashboard' : t('common.signIn', 'Sign in')}
          </Link>

          <Link href="/create">
            <Button size="sm" className="brand-gradient h-9 px-4 text-sm font-semibold text-white">
              Create invoice
            </Button>
          </Link>

          {!hideNavLinks && (
            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {mobileOpen && !hideNavLinks && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden">
          <nav className="flex flex-col" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={user ? '/dashboard' : '/login'}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              {user ? 'Dashboard' : t('common.signIn', 'Sign in')}
            </Link>
          </nav>
          <div className="mt-2 border-t border-border px-3 pt-3 sm:hidden">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </header>
  );
}
