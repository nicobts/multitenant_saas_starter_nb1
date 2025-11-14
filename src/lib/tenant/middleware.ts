import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to handle tenant routing and validation
 * This runs on every request and can redirect/rewrite based on tenant
 */
export function tenantMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  // Extract potential tenant identifier
  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  let tenantSlug: string | null = null;

  // Check for subdomain
  if (hostname.includes("localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
      tenantSlug = subdomain;
    }
  } else if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain !== "www") {
      tenantSlug = subdomain;
    }
  }

  // Public routes that don't require a tenant
  const publicRoutes = ["/", "/login", "/signup", "/forgot-password", "/verify-email"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // If no tenant and not a public route, redirect to main site
  if (!tenantSlug && !isPublicRoute && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
    // You might want to redirect to a landing page or login
    // For now, we'll just continue
    return NextResponse.next();
  }

  return NextResponse.next();
}
