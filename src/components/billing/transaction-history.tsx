"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownRight, ArrowUpRight, History } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "purchase" | "usage" | "refund" | "adjustment";
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: Date;
  metadata?: {
    packageId?: string;
    conversationId?: string;
    messageId?: string;
    tokens?: number;
    modelId?: string;
  };
}

export interface TransactionHistoryProps {
  transactions: Transaction[];
  className?: string;
}

export function TransactionHistory({
  transactions,
  className,
}: TransactionHistoryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          Recent credit purchases and usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
                <p className="text-sm mt-1">
                  Purchase credits to get started with AI features
                </p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  const typeConfig = getTypeConfig(transaction.type);

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          isPositive
            ? "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
            : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
        )}
      >
        {isPositive ? (
          <ArrowUpRight className="h-5 w-5" />
        ) : (
          <ArrowDownRight className="h-5 w-5" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {transaction.description || typeConfig.defaultDescription}
          </p>
          <Badge variant="outline" className="text-xs">
            {typeConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>
            {new Date(transaction.createdAt).toLocaleDateString()} •{" "}
            {new Date(transaction.createdAt).toLocaleTimeString()}
          </span>
          {transaction.metadata?.tokens && (
            <span>• {transaction.metadata.tokens.toLocaleString()} tokens</span>
          )}
          {transaction.metadata?.modelId && (
            <span>• {transaction.metadata.modelId.split("/")[1]}</span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {isPositive ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          Balance: ${transaction.balanceAfter.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function getTypeConfig(type: string) {
  const configs = {
    purchase: {
      label: "Purchase",
      defaultDescription: "Credit purchase",
    },
    usage: {
      label: "Usage",
      defaultDescription: "AI message generation",
    },
    refund: {
      label: "Refund",
      defaultDescription: "Credit refund",
    },
    adjustment: {
      label: "Adjustment",
      defaultDescription: "Balance adjustment",
    },
  };

  return configs[type as keyof typeof configs] || configs.adjustment;
}
