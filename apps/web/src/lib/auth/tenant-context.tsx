'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, TenantApi } from '@invoice/api';

interface TenantContextType {
  activeTenant: Tenant | null;
  tenants: Tenant[];
  setActiveTenant: (tenant: Tenant) => void;
  isLoading: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
  signOut: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>({
    id: 'usr_demo_01',
    email: 'admin@acmedesign.io',
    name: 'Sarah Connor (Studio Director)',
  });

  useEffect(() => {
    async function load() {
      try {
        const list = await TenantApi.getTenants();
        setTenants(list);
        if (list.length > 0) {
          setActiveTenant(list[0]);
        }
      } catch (err) {
        console.error('Failed to load tenants:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const signOut = () => {
    setUser(null);
    setActiveTenant(null);
    window.location.href = '/';
  };

  return (
    <TenantContext.Provider
      value={{
        activeTenant,
        tenants,
        setActiveTenant,
        isLoading,
        user,
        signOut,
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
