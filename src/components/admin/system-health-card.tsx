"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface SystemHealthProps {
  messagesLast24h: number;
  avgCostPerMessage: number;
  errorRate: number;
  avgTokensPerMessage: number;
  className?: string;
}

export function SystemHealthCard({
  messagesLast24h,
  avgCostPerMessage,
  errorRate,
  avgTokensPerMessage,
  className,
}: SystemHealthProps) {
  const isHealthy = errorRate < 5;
  const isWarning = errorRate >= 5 && errorRate < 10;
  const isCritical = errorRate >= 10;

  const healthStatus = isCritical
    ? { label: "Critical", color: "text-red-600", icon: AlertCircle }
    : isWarning
    ? { label: "Warning", color: "text-yellow-600", icon: AlertCircle }
    : { label: "Healthy", color: "text-green-600", icon: CheckCircle2 };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
          <Badge
            variant={isCritical ? "destructive" : isWarning ? "outline" : "default"}
            className={cn(
              !isCritical && !isWarning && "bg-green-100 text-green-800 hover:bg-green-100"
            )}
          >
            <healthStatus.icon className="mr-1 h-3 w-3" />
            {healthStatus.label}
          </Badge>
        </div>
        <CardDescription>System performance metrics (last 24 hours)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Messages Last 24h */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Messages (24h)
            </div>
            <p className="text-2xl font-bold">{messagesLast24h.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {(messagesLast24h / 24).toFixed(1)} per hour
            </p>
          </div>

          {/* Average Cost */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Avg Cost/Message
            </div>
            <p className="text-2xl font-bold">${avgCostPerMessage.toFixed(4)}</p>
            <p className="text-xs text-muted-foreground">
              Per message average
            </p>
          </div>

          {/* Error Rate */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Error Rate
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                isCritical && "text-red-600",
                isWarning && "text-yellow-600",
                isHealthy && "text-green-600"
              )}
            >
              {errorRate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {isCritical ? "Needs attention" : isWarning ? "Monitor closely" : "Within limits"}
            </p>
          </div>

          {/* Average Tokens */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Avg Tokens
            </div>
            <p className="text-2xl font-bold">
              {avgTokensPerMessage.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Tokens per message
            </p>
          </div>
        </div>

        {/* Health Status Bar */}
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Status</span>
              <span className={healthStatus.color}>
                {errorRate.toFixed(2)}% error rate
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  isCritical && "bg-red-600",
                  isWarning && "bg-yellow-600",
                  isHealthy && "bg-green-600"
                )}
                style={{ width: `${Math.min(100, 100 - errorRate * 10)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
