"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  cost?: string;
  totalTokens?: number;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <ScrollArea className={className}>
      <div ref={scrollRef} className="flex flex-col">
        {messages.length === 0 && !isLoading ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">
                No messages yet
              </p>
              <p className="text-sm text-muted-foreground">
                Start a conversation by sending a message below
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.createdAt}
                cost={message.cost ? Number(message.cost) : undefined}
                tokens={message.totalTokens}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 px-4 py-6 bg-muted/50">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background shadow">
                  <Loader2 className="size-4 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    AI is thinking...
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
}
