"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wand2, X } from "lucide-react";
import React, { useState } from "react";

interface TemplateVariable {
  name: string;
  description: string;
  type: "text" | "number" | "boolean" | "select";
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  userPromptTemplate: string;
  variables?: TemplateVariable[];
}

export interface TemplateFormProps {
  template: Template;
  onSubmit: (variables: Record<string, any>) => void;
  onCancel?: () => void;
  className?: string;
}

export function TemplateForm({
  template,
  onSubmit,
  onCancel,
  className,
}: TemplateFormProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    template.variables?.forEach((variable) => {
      initial[variable.name] = variable.defaultValue ?? "";
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const handleValueChange = (name: string, value: any) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Preview the prompt with filled variables
  const previewPrompt = () => {
    let preview = template.userPromptTemplate;
    Object.entries(values).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), String(value || `{{${key}}}`));
    });
    return preview;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="size-5" />
              {template.name}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1">
                {template.description}
              </CardDescription>
            )}
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Variable Inputs */}
          {template.variables && template.variables.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Fill in the variables:</h3>
              {template.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <Label htmlFor={variable.name}>
                    {variable.name}
                    {variable.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {variable.description}
                  </p>

                  {variable.type === "text" && (
                    <Input
                      id={variable.name}
                      value={values[variable.name] || ""}
                      onChange={(e) =>
                        handleValueChange(variable.name, e.target.value)
                      }
                      required={variable.required}
                      placeholder={`Enter ${variable.name}...`}
                    />
                  )}

                  {variable.type === "number" && (
                    <Input
                      id={variable.name}
                      type="number"
                      value={values[variable.name] || ""}
                      onChange={(e) =>
                        handleValueChange(variable.name, e.target.valueAsNumber)
                      }
                      required={variable.required}
                      placeholder={`Enter ${variable.name}...`}
                    />
                  )}

                  {variable.type === "select" && variable.options && (
                    <Select
                      value={values[variable.name] || ""}
                      onValueChange={(value) =>
                        handleValueChange(variable.name, value)
                      }
                    >
                      <SelectTrigger id={variable.name}>
                        <SelectValue placeholder={`Select ${variable.name}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {variable.options.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {variable.type === "boolean" && (
                    <Select
                      value={String(values[variable.name] ?? "")}
                      onValueChange={(value) =>
                        handleValueChange(variable.name, value === "true")
                      }
                    >
                      <SelectTrigger id={variable.name}>
                        <SelectValue placeholder={`Select ${variable.name}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <Textarea
              value={previewPrompt()}
              readOnly
              className="min-h-[100px] resize-none bg-muted"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Wand2 className="mr-2 size-4" />
              Use Template
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
