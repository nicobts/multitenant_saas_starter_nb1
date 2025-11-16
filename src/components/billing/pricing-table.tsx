"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  description?: string | null;
  credits: number;
  price: number;
  isPopular: boolean;
  metadata?: {
    features?: string[];
    displayOrder?: number;
    bonusCredits?: number;
  };
}

export interface PricingTableProps {
  packages: CreditPackage[];
  onSelectPackage: (packageId: string) => void;
  className?: string;
}

export function PricingTable({
  packages,
  onSelectPackage,
  className,
}: PricingTableProps) {
  const sortedPackages = [...packages].sort((a, b) => {
    const orderA = a.metadata?.displayOrder ?? 999;
    const orderB = b.metadata?.displayOrder ?? 999;
    return orderA - orderB;
  });

  return (
    <div className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}>
      {sortedPackages.map((pkg) => (
        <PricingCard
          key={pkg.id}
          package={pkg}
          onSelect={() => onSelectPackage(pkg.id)}
        />
      ))}
    </div>
  );
}

interface PricingCardProps {
  package: CreditPackage;
  onSelect: () => void;
}

function PricingCard({ package: pkg, onSelect }: PricingCardProps) {
  const pricePerDollar = pkg.credits / pkg.price;
  const bonusCredits = pkg.metadata?.bonusCredits || 0;
  const totalCredits = pkg.credits + bonusCredits;

  return (
    <Card
      className={cn(
        "relative transition-all hover:shadow-lg",
        pkg.isPopular && "border-primary shadow-md"
      )}
    >
      {pkg.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3 py-1">
            <Sparkles className="mr-1 h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{pkg.name}</CardTitle>
        {pkg.description && (
          <CardDescription>{pkg.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${pkg.price.toFixed(0)}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalCredits} AI credits
          </p>
          {bonusCredits > 0 && (
            <p className="text-xs text-green-600 font-medium">
              +{bonusCredits} bonus credits included!
            </p>
          )}
        </div>

        {/* Value */}
        <div className="rounded-lg bg-muted px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground">Credits per $1</p>
          <p className="text-lg font-semibold">
            {pricePerDollar.toFixed(2)}
          </p>
        </div>

        {/* Features */}
        {pkg.metadata?.features && pkg.metadata.features.length > 0 && (
          <ul className="space-y-2">
            {pkg.metadata.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <Button
          onClick={onSelect}
          className="w-full"
          variant={pkg.isPopular ? "default" : "outline"}
        >
          Purchase Package
        </Button>
      </CardContent>
    </Card>
  );
}
