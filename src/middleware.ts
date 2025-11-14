import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tenantMiddleware } from "@/lib/tenant/middleware";

export function middleware(request: NextRequest) {
  // Run tenant middleware
  const tenantResponse = tenantMiddleware(request);
  if (tenantResponse) return tenantResponse;

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
