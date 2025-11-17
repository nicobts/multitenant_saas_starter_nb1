"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Search, TrendingUp } from "lucide-react";
import React, { useState } from "react";

interface Template {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  usageCount: number;
  isPublic: boolean;
  variables?: Array<{
    name: string;
    description: string;
    type: "text" | "number" | "boolean" | "select";
    required: boolean;
    defaultValue?: any;
    options?: string[];
  }>;
}

export interface TemplateLibraryProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  onCreateNew?: () => void;
  className?: string;
}

export function TemplateLibrary({
  templates,
  onSelectTemplate,
  onCreateNew,
  className,
}: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(
    new Set(templates.map((t) => t.category).filter(Boolean))
  );

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      !selectedCategory || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort by usage count
  const sortedTemplates = [...filteredTemplates].sort(
    (a, b) => b.usageCount - a.usageCount
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5" />
              Template Library
            </CardTitle>
            <CardDescription>
              Browse and use pre-made prompt templates
            </CardDescription>
          </div>
          {onCreateNew && (
            <Button onClick={onCreateNew} size="sm">
              Create Template
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        )}

        <Separator />

        {/* Template List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {sortedTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No templates found</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              sortedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onSelectTemplate(template)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {template.name}
              {template.isPublic && (
                <Badge variant="secondary" className="text-xs">
                  Public
                </Badge>
              )}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1 text-sm">
                {template.description}
              </CardDescription>
            )}
          </div>
          {template.usageCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {template.usageCount}
            </div>
          )}
        </div>
      </CardHeader>
      {(template.category || (template.variables && template.variables.length > 0)) && (
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {template.category && (
              <Badge variant="outline" className="text-xs capitalize">
                {template.category}
              </Badge>
            )}
            {template.variables && template.variables.length > 0 && (
              <span>{template.variables.length} variables</span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
