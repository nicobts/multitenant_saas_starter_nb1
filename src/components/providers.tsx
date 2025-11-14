"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { orpc, orpcClient } from "@/lib/orpc/client";
import { Toaster } from "sonner";
import { useState } from "react";
import type { Tenant } from "@/db/schema";
import { TenantProvider } from "@/lib/tenant/context";

interface ProvidersProps {
  children: React.ReactNode;
  tenant: Tenant | null;
}

export function Providers({ children, tenant }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <orpc.Provider client={orpcClient} queryClient={queryClient}>
          <TenantProvider tenant={tenant}>
            {children}
            <Toaster richColors position="top-right" />
          </TenantProvider>
        </orpc.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
