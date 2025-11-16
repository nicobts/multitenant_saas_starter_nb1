"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import React from "react";

interface RecentConversation {
  id: string;
  title: string;
  tenantId: string;
  tenantName: string;
  modelId: string;
  messageCount: number;
  totalCost: number;
  createdAt: Date;
  lastMessageAt: Date | null;
}

export interface RecentActivityTableProps {
  data: RecentConversation[];
  className?: string;
}

export function RecentActivityTable({ data, className }: RecentActivityTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest AI conversations across all tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((conversation) => {
                  const lastActive = conversation.lastMessageAt || conversation.createdAt;
                  const timeAgo = getTimeAgo(new Date(lastActive));
                  const modelName = conversation.modelId.split("/")[1] || conversation.modelId;

                  return (
                    <TableRow key={conversation.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="truncate">{conversation.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {conversation.tenantName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {modelName}
                      </TableCell>
                      <TableCell className="text-right">
                        {conversation.messageCount}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${conversation.totalCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {timeAgo}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
