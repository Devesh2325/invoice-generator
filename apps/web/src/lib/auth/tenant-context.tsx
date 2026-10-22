'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Tenant, TenantApi, TenantBrandSettings } from '@invoice/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
}

interface TenantContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  setActiveTenant: (tenant: Tenant) => void;
  brandSettings: TenantBrandSettings | null;
  tenantCurrency: string;
  isLoading: boolean;
  user: AuthUser | null;
  updateUser: (updatedUser: Partial<AuthUser>) => void;
  signOut: () => void;
  refreshTenants: () => Promise<void>;
  refreshBrandSettings: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [brandSettings, setBrandSettings] = useState<TenantBrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadBrandForTenant = useCallback(async (tenantId: string) => {
    try {
      const settings = await TenantApi.getBrandSettings(tenantId);
      setBrandSettings(settings);
    } catch (err) {
      console.error('Failed to load brand settings:', err);
    }
  }, []);

  const loadUserAndTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      let currentUser: AuthUser | null = null;
      if (typeof window !== 'undefined') {
        const storedUser = window.localStorage.getItem('billcraft_current_user');
        if (storedUser) {
          try {
            currentUser = JSON.parse(storedUser);
          } catch {
            currentUser = null;
          }
        }
      }
      setUser(currentUser);

      if (!currentUser) {
        setTenants([]);
        setActiveTenantState(null);
        setBrandSettings(null);
        return;
      }

      const list = await TenantApi.getTenants(currentUser.id);
      setTenants(list);

      let chosen: Tenant | null = list[0] || null;
      if (typeof window !== 'undefined') {
        const activeId = window.localStorage.getItem('billcraft_active_tenant_id');
        if (activeId) {
          const found = list.find((t) => t.id === activeId);
          if (found) chosen = found;
        }
        if (chosen) {
          window.localStorage.setItem('billcraft_active_tenant_id', chosen.id);
        }
      }
      setActiveTenantState(chosen);
      if (chosen) {
        await loadBrandForTenant(chosen.id);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loadBrandForTenant]);

  useEffect(() => {
    loadUserAndTenants();
  }, [loadUserAndTenants]);

  // Re-verify active user and tenant whenever route changes or auth state is updated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUserRaw = window.localStorage.getItem('billcraft_current_user');
    const storedActiveTenantId = window.localStorage.getItem('billcraft_active_tenant_id');
    let storedUserId: string | null = null;
    if (storedUserRaw) {
      try {
        const parsed = JSON.parse(storedUserRaw);
        if (parsed?.id) storedUserId = parsed.id;
      } catch { }
    }
    if (
      storedUserId !== (user?.id || null) ||
      (storedActiveTenantId && storedActiveTenantId !== activeTenant?.id)
    ) {
      loadUserAndTenants();
    }
  }, [pathname, user?.id, activeTenant?.id, loadUserAndTenants]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAuthChange = () => {
      loadUserAndTenants();
    };
    window.addEventListener('billcraft-auth-updated', handleAuthChange);
    return () => window.removeEventListener('billcraft-auth-updated', handleAuthChange);
  }, [loadUserAndTenants]);

  const setActiveTenant = (tenant: Tenant) => {
    setActiveTenantState(tenant);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('billcraft_active_tenant_id', tenant.id);
    }
    loadBrandForTenant(tenant.id);
  };

  const refreshBrandSettings = useCallback(async () => {
    if (activeTenant) {
      await loadBrandForTenant(activeTenant.id);
      const list = await TenantApi.getTenants(user?.id);
      setTenants(list);
      const updatedActive = list.find((t) => t.id === activeTenant.id);
      if (updatedActive) {
        setActiveTenantState(updatedActive);
      }
    }
  }, [activeTenant, loadBrandForTenant, user?.id]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('billcraft_current_user', JSON.stringify(updated));
        window.dispatchEvent(new Event('billcraft-auth-changed'));
      }
      return updated;
    });
  }, []);

  const signOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('billcraft_current_user');
      window.localStorage.removeItem('billcraft_current_user_id');
      window.localStorage.removeItem('billcraft_active_tenant_id');
    }
    setUser(null);
    setActiveTenantState(null);
    setBrandSettings(null);
    window.location.href = '/login';
  };

  const tenantCurrency =
    brandSettings?.currency || activeTenant?.currency || 'INR';

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        tenants,
        setActiveTenant,
        brandSettings,
        tenantCurrency,
        isLoading,
        user,
        updateUser,
        signOut,
        refreshTenants: loadUserAndTenants,
        refreshBrandSettings,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return ctx;
}
