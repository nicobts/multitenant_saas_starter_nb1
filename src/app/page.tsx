import { getTenant } from "@/lib/tenant/get-tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function HomePage() {
  const tenant = await getTenant();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Multitenant SaaS Starter
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A production-ready starter template with Next.js, PostgreSQL, and modern tooling
            </p>
          </div>

          {tenant ? (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Welcome to {tenant.name}</CardTitle>
                <CardDescription>
                  You are viewing the tenant: {tenant.slug}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card>
              <CardHeader>
                <CardTitle>Multi-tenant Ready</CardTitle>
                <CardDescription>
                  Built-in support for subdomain and custom domain routing with tenant isolation
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Type-safe APIs</CardTitle>
                <CardDescription>
                  End-to-end type safety with oRPC and Drizzle ORM
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Production Grade</CardTitle>
                <CardDescription>
                  Includes authentication, payments, email, monitoring, and more
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
