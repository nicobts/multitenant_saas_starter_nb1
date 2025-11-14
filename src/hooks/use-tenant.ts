"use client";

import { useTenant as useTenantContext } from "@/lib/tenant/context";

export function useTenant() {
  return useTenantContext();
}
