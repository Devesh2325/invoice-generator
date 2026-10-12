'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant, TenantApi, TenantBrandSettings } from '@invoice/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface TenantContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  setActiveTenant: (tenant: Tenant) => void;
  brandSettings: TenantBrandSettings | null;
  tenantCurrency: string;
  isLoading: boolean;
  user: AuthUser | null;
  signOut: () => void;
  refreshTenants: () => Promise<void>;
  refreshBrandSettings: () => Promise<void>;
}

const DEFAULT_DEMO_USER: AuthUser = {
  id: 'usr_demo_01',
  email: 'admin@acmedesign.io',
  name: 'Sarah Connor (Studio Director)',
};

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [brandSettings, setBrandSettings] = useState<TenantBrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_DEMO_USER);

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
      let currentUser: AuthUser = DEFAULT_DEMO_USER;
      if (typeof window !== 'undefined') {
        const storedUser = window.localStorage.getItem('billcraft_current_user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        } else {
          window.localStorage.setItem('billcraft_current_user_id', DEFAULT_DEMO_USER.id);
        }
      }
      setUser(currentUser);

      const list = await TenantApi.getTenants(currentUser.id);
      setTenants(list);

      let chosen: Tenant | null = list[0] || null;
      if (typeof window !== 'undefined') {
        const activeId = window.localStorage.getItem('billcraft_active_tenant_id');
        if (activeId) {
          const found = list.find((t) => t.id === activeId);
          if (found) chosen = found;
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

  const signOut = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('billcraft_current_user');
      window.localStorage.removeItem('billcraft_current_user_id');
      window.localStorage.removeItem('billcraft_active_tenant_id');
    }
    setUser(null);
    setActiveTenantState(null);
    setBrandSettings(null);
    window.location.href = '/';
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
