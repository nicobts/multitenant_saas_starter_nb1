"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import React from "react";

interface RevenueTrend {
  date: string;
  revenue: number;
  usage: number;
}

export interface RevenueChartProps {
  data: RevenueTrend[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const maxUsage = Math.max(...data.map((d) => d.usage), 1);
  const maxValue = Math.max(maxRevenue, maxUsage);

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalUsage = data.reduce((sum, d) => sum + d.usage, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Revenue & Usage Trends
        </CardTitle>
        <CardDescription>
          Daily revenue from credit purchases and usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Usage</p>
            <p className="text-2xl font-bold text-blue-600">
              ${totalUsage.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((item, index) => {
              const revenueWidth = (item.revenue / maxValue) * 100;
              const usageWidth = (item.usage / maxValue) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-green-600">
                        ${item.revenue.toFixed(2)}
                      </span>
                      <span className="text-blue-600">
                        ${item.usage.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {/* Revenue Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all"
                        style={{ width: `${revenueWidth}%` }}
                      />
                    </div>
                    {/* Usage Bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${usageWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No revenue data available</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-600 rounded-full" />
            <span className="text-xs text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-blue-600 rounded-full" />
            <span className="text-xs text-muted-foreground">Usage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
