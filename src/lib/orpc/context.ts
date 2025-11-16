import { auth } from "@/lib/auth";
import { getTenant } from "@/lib/tenant/get-tenant";
import { db } from "@/db";
import type { User } from "@/db/schema";

export async function createContext(request: Request) {
  // Get the session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Get the tenant
  const tenant = await getTenant();

  return {
    db,
    user: session?.user as User | null,
    session,
    tenant,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
