import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminRoles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { LayoutDashboard, Users, Flag, Activity, Shield } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current user session
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is super admin
  const adminRole = await db.query.adminRoles.findFirst({
    where: and(
      eq(adminRoles.userId, session.user.id),
      eq(adminRoles.isActive, true)
    ),
  });

  if (!adminRole || adminRole.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/admin" className="mr-6 flex items-center space-x-2">
              <Shield className="size-6" />
              <span className="font-bold">Super Admin</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/admin"
                className="transition-colors hover:text-foreground/80"
              >
                <LayoutDashboard className="size-4 inline mr-2" />
                Dashboard
              </Link>
              <Link
                href="/admin/tenants"
                className="transition-colors hover:text-foreground/80"
              >
                <Users className="size-4 inline mr-2" />
                Tenants
              </Link>
              <Link
                href="/admin/feature-flags"
                className="transition-colors hover:text-foreground/80"
              >
                <Flag className="size-4 inline mr-2" />
                Feature Flags
              </Link>
              <Link
                href="/admin/impersonation"
                className="transition-colors hover:text-foreground/80"
              >
                <Activity className="size-4 inline mr-2" />
                Impersonation Logs
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href="/dashboard">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                Back to App
              </button>
            </Link>
          </div>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
