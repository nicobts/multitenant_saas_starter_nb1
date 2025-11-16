import { requireTenant } from "@/lib/tenant/get-tenant";
import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();
  const t = useTranslations("nav");

  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:underline">
                {t("dashboard")}
              </Link>
              <Link href="/dashboard/projects" className="hover:underline">
                {t("projects")}
              </Link>
              <Link href="/dashboard/team" className="hover:underline">
                {t("team")}
              </Link>
              <Link href="/dashboard/settings" className="hover:underline">
                {t("settings")}
              </Link>
              <LanguageSwitcher />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
