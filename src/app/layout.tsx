import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { getTenant } from "@/lib/tenant/get-tenant";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers tenant={tenant}>{children}</Providers>
      </body>
    </html>
  );
}
