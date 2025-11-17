"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MessageSquare, Zap } from "lucide-react";
import React from "react";

export interface UsageStatsProps {
  totalCost: number;
  totalTokens: number;
  totalMessages: number;
  byModel?: Record<
    string,
    {
      cost: number;
      tokens: number;
      messages: number;
    }
  >;
  className?: string;
}

export function UsageStats({
  totalCost,
  totalTokens,
  totalMessages,
  byModel,
  className,
}: UsageStatsProps) {
  return (
    <div className={className}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTokens.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMessages.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Exchanged</p>
          </CardContent>
        </Card>
      </div>

      {/* By Model Breakdown */}
      {byModel && Object.keys(byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byModel)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([modelId, stats]) => (
                  <div key={modelId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{modelId.split("/")[0]}</Badge>
                      <span className="text-sm font-medium">
                        {modelId.split("/")[1]}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {stats.messages} msgs
                      </span>
                      <span className="text-muted-foreground">
                        {stats.tokens.toLocaleString()} tokens
                      </span>
                      <span className="font-medium">
                        ${stats.cost.toFixed(4)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
