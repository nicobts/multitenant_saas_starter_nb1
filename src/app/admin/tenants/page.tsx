"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { orpc } from "@/lib/orpc/client";
import { Search, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function AdminTenantsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = orpc.admin.listTenants.useQuery({
    limit: 50,
    offset: 0,
    search,
  });

  const tenants = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            View and manage all tenant accounts
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tenants List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tenants found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tenants.map((item) => (
            <Card key={item.tenant.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {item.tenant.name}
                      <Badge
                        variant={item.tenant.isActive ? "default" : "secondary"}
                      >
                        {item.tenant.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {item.tenant.plan}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Slug: {item.tenant.slug} | {item.memberCount} members
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/tenants/${item.tenant.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="size-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(item.tenant.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Users</p>
                    <p className="font-medium">{item.tenant.maxUsers}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Projects</p>
                    <p className="font-medium">{item.tenant.maxProjects}</p>
                  </div>
                  {item.tenant.stripeCustomerId && (
                    <div>
                      <p className="text-muted-foreground">Stripe Status</p>
                      <p className="font-medium capitalize">
                        {item.tenant.stripeSubscriptionStatus || "N/A"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
