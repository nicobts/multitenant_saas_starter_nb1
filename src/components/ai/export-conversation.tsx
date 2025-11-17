"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText } from "lucide-react";
import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  cost?: string;
  totalTokens?: number;
}

interface Conversation {
  id: string;
  title: string;
  modelId: string;
  createdAt: Date;
  messages: Message[];
  totalCost: string;
  totalTokens: number;
}

export interface ExportConversationProps {
  conversation: Conversation;
  className?: string;
}

export function ExportConversation({
  conversation,
  className,
}: ExportConversationProps) {
  const exportToMarkdown = () => {
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Model**: ${conversation.modelId}\n`;
    markdown += `**Date**: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    markdown += `**Total Cost**: $${Number(conversation.totalCost).toFixed(4)}\n`;
    markdown += `**Total Tokens**: ${conversation.totalTokens.toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    conversation.messages.forEach((message) => {
      const role = message.role === "user" ? "👤 You" : "🤖 Assistant";
      const timestamp = new Date(message.createdAt).toLocaleTimeString();

      markdown += `## ${role} (${timestamp})\n\n`;
      markdown += `${message.content}\n\n`;

      if (message.role === "assistant" && (message.cost || message.totalTokens)) {
        markdown += `*`;
        if (message.totalTokens) {
          markdown += `${message.totalTokens} tokens`;
        }
        if (message.cost) {
          markdown += ` • $${Number(message.cost).toFixed(4)}`;
        }
        markdown += `*\n\n`;
      }

      markdown += `---\n\n`;
    });

    // Download
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(conversation.title)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToText = () => {
    let text = `${conversation.title}\n`;
    text += `${"=".repeat(conversation.title.length)}\n\n`;
    text += `Model: ${conversation.modelId}\n`;
    text += `Date: ${new Date(conversation.createdAt).toLocaleString()}\n`;
    text += `Total Cost: $${Number(conversation.totalCost).toFixed(4)}\n`;
    text += `Total Tokens: ${conversation.totalTokens.toLocaleString()}\n\n`;
    text += `${"-".repeat(80)}\n\n`;

    conversation.messages.forEach((message) => {
      const role = message.role === "user" ? "YOU" : "ASSISTANT";
      const timestamp = new Date(message.createdAt).toLocaleTimeString();

      text += `[${role}] ${timestamp}\n`;
      text += `${message.content}\n`;

      if (message.role === "assistant" && (message.cost || message.totalTokens)) {
        text += `(`;
        if (message.totalTokens) {
          text += `${message.totalTokens} tokens`;
        }
        if (message.cost) {
          text += ` • $${Number(message.cost).toFixed(4)}`;
        }
        text += `)\n`;
      }

      text += `\n${"-".repeat(80)}\n\n`;
    });

    // Download
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(conversation.title)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = {
      title: conversation.title,
      modelId: conversation.modelId,
      createdAt: conversation.createdAt,
      totalCost: Number(conversation.totalCost),
      totalTokens: conversation.totalTokens,
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        cost: msg.cost ? Number(msg.cost) : undefined,
        tokens: msg.totalTokens,
      })),
    };

    const json = JSON.stringify(data, null, 2);

    // Download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(conversation.title)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToMarkdown}>
          <FileText className="mr-2 size-4" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToText}>
          <FileText className="mr-2 size-4" />
          Export as Text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 size-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}
