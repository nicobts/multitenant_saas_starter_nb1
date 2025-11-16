import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getTenant } from "@/lib/tenant/get-tenant";

export const metadata: Metadata = {
  title: "Multitenant SaaS Starter",
  description: "A production-ready multitenant SaaS starter template",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers tenant={tenant}>{children}</Providers>
      </body>
    </html>
  );
}
