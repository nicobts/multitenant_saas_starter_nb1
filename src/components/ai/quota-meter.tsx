"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface QuotaMeterProps {
  used: number;
  limit: number;
  className?: string;
}

export function QuotaMeter({ used, limit, className }: QuotaMeterProps) {
  const percentage = (used / limit) * 100;
  const remaining = Math.max(0, limit - used);
  const isNearLimit = percentage >= 80;
  const isExceeded = percentage >= 100;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Monthly AI Quota
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress
            value={Math.min(percentage, 100)}
            className={cn(
              "h-3",
              isExceeded && "[&>*]:bg-destructive",
              isNearLimit && !isExceeded && "[&>*]:bg-yellow-500"
            )}
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              ${used.toFixed(2)} / ${limit.toFixed(2)}
            </span>
            <span
              className={cn(
                "font-medium",
                isExceeded && "text-destructive",
                isNearLimit && !isExceeded && "text-yellow-600"
              )}
            >
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Status */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border p-3",
            isExceeded && "border-destructive/50 bg-destructive/10",
            isNearLimit && !isExceeded && "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
          )}
        >
          {isExceeded ? (
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          ) : isNearLimit ? (
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">
              {isExceeded
                ? "Quota Exceeded"
                : isNearLimit
                ? "Approaching Limit"
                : "Quota Healthy"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isExceeded
                ? "You've exceeded your monthly quota. Upgrade your plan to continue."
                : isNearLimit
                ? `Only $${remaining.toFixed(2)} remaining this month.`
                : `You have $${remaining.toFixed(2)} remaining this month.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
