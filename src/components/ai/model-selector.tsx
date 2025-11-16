"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import React from "react";

interface Model {
  modelId: string;
  name: string;
  provider: string;
  description?: string | null;
  inputCostPer1kTokens: string;
  outputCostPer1kTokens: string;
  capabilities?: {
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    jsonMode?: boolean;
  };
}

export interface ModelSelectorProps {
  models: Model[];
  value?: string;
  onValueChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ModelSelector({
  models,
  value,
  onValueChange,
  disabled = false,
  className,
}: ModelSelectorProps) {
  // Group models by provider
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const selectedModel = models.find((m) => m.modelId === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select a model">
          {selectedModel && (
            <div className="flex items-center gap-2">
              <span>{selectedModel.name}</span>
              <Badge variant="outline" className="text-xs">
                {selectedModel.provider}
              </Badge>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(modelsByProvider).map(([provider, providerModels]) => (
          <SelectGroup key={provider}>
            <SelectLabel className="capitalize">{provider}</SelectLabel>
            {providerModels.map((model) => (
              <SelectItem key={model.modelId} value={model.modelId}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.capabilities && (
                      <div className="flex gap-1">
                        {model.capabilities.vision && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Vision
                          </Badge>
                        )}
                        {model.capabilities.functionCalling && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Functions
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ${model.inputCostPer1kTokens}/1K in • $
                    {model.outputCostPer1kTokens}/1K out
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
