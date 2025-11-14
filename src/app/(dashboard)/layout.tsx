import { requireTenant } from "@/lib/tenant/get-tenant";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();

  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <nav className="flex gap-4">
              <a href="/dashboard" className="hover:underline">
                Dashboard
              </a>
              <a href="/dashboard/projects" className="hover:underline">
                Projects
              </a>
              <a href="/dashboard/team" className="hover:underline">
                Team
              </a>
              <a href="/dashboard/settings" className="hover:underline">
                Settings
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
