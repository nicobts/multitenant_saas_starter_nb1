"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";
import React from "react";

interface ModelUsage {
  modelId: string;
  totalRequests: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
}

export interface ModelUsageTableProps {
  data: ModelUsage[];
  className?: string;
}

export function ModelUsageTable({ data, className }: ModelUsageTableProps) {
  const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0);
  const totalRequests = data.reduce((sum, item) => sum + item.totalRequests, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="size-5" />
          Usage by Model
        </CardTitle>
        <CardDescription>
          Breakdown of AI usage across different models
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => {
                  const costPercentage = totalCost > 0
                    ? (item.totalCost / totalCost) * 100
                    : 0;
                  const _requestPercentage = totalRequests > 0
                    ? (item.totalRequests / totalRequests) * 100
                    : 0;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{item.modelId.split("/")[1] || item.modelId}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.modelId.split("/")[0]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalRequests.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalMessages.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalTokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${item.totalCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {costPercentage.toFixed(1)}%
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
            <p>No model usage data available</p>
          </div>
        )}

        {/* Summary */}
        {data.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total across {data.length} models
            </span>
            <div className="flex gap-6">
              <span>
                <span className="text-muted-foreground">Requests: </span>
                <span className="font-semibold">{totalRequests.toLocaleString()}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Total Cost: </span>
                <span className="font-semibold">${totalCost.toFixed(4)}</span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
