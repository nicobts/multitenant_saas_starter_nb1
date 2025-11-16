"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ModelSelector } from "./model-selector";
import { Separator } from "@/components/ui/separator";
import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  cost?: string;
  totalTokens?: number;
}

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

export interface ChatInterfaceProps {
  messages: Message[];
  models: Model[];
  selectedModel?: string;
  onModelChange: (modelId: string) => void;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  conversationTitle?: string;
  className?: string;
}

export function ChatInterface({
  messages,
  models,
  selectedModel,
  onModelChange,
  onSendMessage,
  isLoading = false,
  conversationTitle = "AI Chat",
  className,
}: ChatInterfaceProps) {
  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{conversationTitle}</h2>
          <div className="w-[300px]">
            <ModelSelector
              models={models}
              value={selectedModel}
              onValueChange={onModelChange}
              disabled={isLoading}
            />
          </div>
        </div>
        <Separator />
      </CardHeader>

      {/* Content */}
      <CardContent className="p-0">
        <div className="flex flex-col h-[600px]">
          {/* Messages */}
          <MessageList
            messages={messages}
            isLoading={isLoading}
            className="flex-1"
          />

          <Separator />

          {/* Input */}
          <div className="p-4">
            <MessageInput
              onSend={onSendMessage}
              disabled={isLoading || !selectedModel}
              placeholder={
                selectedModel
                  ? "Type your message..."
                  : "Select a model to start chatting..."
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
