"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import React from "react";

interface TenantStats {
  tenantId: string;
  tenantName: string;
  lifetimeSpent: number;
  lifetimePurchased: number;
  balance: number;
  messageCount: number;
  conversationCount: number;
}

export interface TopTenantsTableProps {
  data: TenantStats[];
  className?: string;
}

export function TopTenantsTable({ data, className }: TopTenantsTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Top Tenants
        </CardTitle>
        <CardDescription>
          Tenants with the highest AI usage and spending
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Conversations</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Purchased</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((tenant, index) => {
                  const isLowBalance = tenant.balance < 5;
                  const utilizationRate = tenant.lifetimePurchased > 0
                    ? (tenant.lifetimeSpent / tenant.lifetimePurchased) * 100
                    : 0;

                  return (
                    <TableRow key={tenant.tenantId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{tenant.tenantName}</span>
                          <span className="text-xs text-muted-foreground">
                            Rank #{index + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant.conversationCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {tenant.messageCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        ${tenant.lifetimeSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${tenant.lifetimePurchased.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={isLowBalance ? "text-yellow-600 font-medium" : ""}>
                          ${tenant.balance.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isLowBalance ? "destructive" : "outline"}
                        >
                          {isLowBalance ? "Low Balance" : `${utilizationRate.toFixed(0)}% Used`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tenant data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
