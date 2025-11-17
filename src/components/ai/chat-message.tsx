"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import React from "react";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
  cost?: number;
  tokens?: number;
}

export function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming = false,
  cost,
  tokens,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-6",
        isUser ? "bg-background" : "bg-muted/50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-background text-foreground"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {isUser ? "You" : "AI Assistant"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          {isStreaming ? (
            <StreamingText content={content} />
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Metadata */}
        {!isUser && (cost !== undefined || tokens !== undefined) && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {tokens !== undefined && <span>{tokens.toLocaleString()} tokens</span>}
            {cost !== undefined && <span>${cost.toFixed(4)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StreamingText component for animated text streaming
 */
function StreamingText({ content }: { content: string }) {
  return (
    <div className="relative">
      <p className="whitespace-pre-wrap">{content}</p>
      <span className="inline-block h-4 w-1 animate-pulse bg-foreground" />
    </div>
  );
}
