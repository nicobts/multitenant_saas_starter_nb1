"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Tenant } from "@/db/schema";

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

interface TenantProviderProps {
  tenant: Tenant | null;
  isLoading?: boolean;
  children: ReactNode;
}

export function TenantProvider({
  tenant,
  isLoading = false,
  children,
}: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

export function useRequireTenant() {
  const { tenant, isLoading } = useTenant();
  if (!isLoading && !tenant) {
    throw new Error("Tenant is required but not found");
  }
  return { tenant: tenant!, isLoading };
}
