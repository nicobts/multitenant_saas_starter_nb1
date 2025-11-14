import { headers } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Extracts tenant identifier from the request
 * Supports both subdomain (e.g., acme.example.com) and custom domain routing
 */
export async function getTenantIdentifier(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return null;

  // Remove port if present
  const hostname = host.split(":")[0];

  // Check if it's a subdomain pattern (e.g., tenant.example.com)
  const parts = hostname.split(".");

  // If localhost or IP, try to get from subdomain
  if (hostname.includes("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    // For localhost:3000 or tenant.localhost:3000
    const subdomain = parts[0];
    if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
      return subdomain;
    }
    return null;
  }

  // For production domains
  if (parts.length >= 3) {
    // subdomain.example.com
    const subdomain = parts[0];
    if (subdomain !== "www") {
      return subdomain;
    }
  }

  // If it's a custom domain, use the full hostname
  return hostname;
}

/**
 * Get the current tenant based on the request context
 * This is cached per request to avoid multiple database queries
 */
export const getTenant = cache(async () => {
  const identifier = await getTenantIdentifier();

  if (!identifier) {
    return null;
  }

  // Try to find by slug first (subdomain)
  let tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, identifier),
  });

  // If not found, try custom domain
  if (!tenant) {
    tenant = await db.query.tenants.findFirst({
      where: eq(tenants.domain, identifier),
    });
  }

  if (!tenant || !tenant.isActive) {
    return null;
  }

  return tenant;
});

/**
 * Require a tenant or throw an error
 */
export async function requireTenant() {
  const tenant = await getTenant();

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  return tenant;
}
