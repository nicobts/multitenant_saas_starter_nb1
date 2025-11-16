"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, TrendingUp, Plus } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export interface CreditBalanceProps {
  balance: number;
  lifetimeSpent: number;
  lifetimePurchased: number;
  onPurchase?: () => void;
  className?: string;
}

export function CreditBalance({
  balance,
  lifetimeSpent,
  lifetimePurchased,
  onPurchase,
  className,
}: CreditBalanceProps) {
  const isLowBalance = balance < 5;

  return (
    <Card className={cn(className, isLowBalance && "border-yellow-500")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Credits
          </CardTitle>
          {onPurchase && (
            <Button onClick={onPurchase} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              ${balance.toFixed(2)}
            </span>
            {isLowBalance && (
              <span className="text-sm text-yellow-600 font-medium">
                Low Balance
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Lifetime Purchased */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Total Purchased
            </div>
            <p className="text-lg font-semibold text-green-600">
              ${lifetimePurchased.toFixed(2)}
            </p>
          </div>

          {/* Lifetime Spent */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              Total Spent
            </div>
            <p className="text-lg font-semibold text-red-600">
              ${lifetimeSpent.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Low Balance Warning */}
        {isLowBalance && (
          <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-3">
            <p className="text-sm text-yellow-900 dark:text-yellow-200">
              ⚠️ Your credit balance is running low. Purchase more credits to continue using AI features.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
