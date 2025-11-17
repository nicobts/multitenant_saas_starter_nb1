import { requireTenant } from "@/lib/tenant/get-tenant";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationCenter } from "@/components/notification-center";
import Link from "next/link";

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
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <Link href="/ai" className="hover:underline">
                AI Chat
              </Link>
              <NotificationCenter />
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
