"use client";

import { ChatInterface } from "@/components/ai/chat-interface";
import { ConversationSidebar } from "@/components/ai/conversation-sidebar";
import { QuotaMeter } from "@/components/ai/quota-meter";
import { UsageStats } from "@/components/ai/usage-stats";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orpc } from "@/lib/orpc/client";
import { PlusCircle, Settings } from "lucide-react";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AIPage() {
  const { toast } = useToast();
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >();
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>();

  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } =
    orpc.ai.conversations.list.useQuery({
      limit: 50,
      offset: 0,
    });

  // Fetch current conversation with messages
  const { data: currentConversation, refetch: refetchMessages } =
    orpc.ai.conversations.get.useQuery(
      { id: currentConversationId! },
      { enabled: !!currentConversationId }
    );

  // Fetch models
  const { data: models = [] } = orpc.ai.models.list.useQuery({});

  // Fetch quota
  const { data: quota } = orpc.ai.usage.getQuota.useQuery();

  // Fetch usage stats
  const { data: stats } = orpc.ai.usage.getStats.useQuery({
    period: "monthly",
  });

  // Create conversation mutation
  const createConversation = orpc.ai.conversations.create.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      setSelectedModel(data.modelId);
      refetchConversations();
      setNewConversationOpen(false);
      setNewConversationTitle("");
      toast({
        title: "Conversation created",
        description: "Your new conversation is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessage = orpc.ai.messages.send.useMutation({
    onSuccess: () => {
      refetchMessages();
      refetchConversations();
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversation = orpc.ai.conversations.delete.useMutation({
    onSuccess: () => {
      if (currentConversationId) {
        setCurrentConversationId(undefined);
      }
      refetchConversations();
      toast({
        title: "Conversation deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNewConversation = () => {
    if (!selectedModel) {
      toast({
        title: "Please select a model",
        variant: "destructive",
      });
      return;
    }

    if (!newConversationTitle.trim()) {
      toast({
        title: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    createConversation.mutate({
      title: newConversationTitle,
      modelId: selectedModel,
    });
  };

  const handleSendMessage = (content: string) => {
    if (!currentConversationId) return;

    sendMessage.mutate({
      conversationId: currentConversationId,
      content,
    });
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground">
            Chat with AI models powered by OpenRouter
          </p>
        </div>
        <Dialog open={newConversationOpen} onOpenChange={setNewConversationOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Create a new AI conversation. Choose a model to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Code Helper"
                  value={newConversationTitle}
                  onChange={(e) => setNewConversationTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <select
                  id="model"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="">Select a model...</option>
                  {models.map((model) => (
                    <option key={model.modelId} value={model.modelId}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleNewConversation}
                disabled={createConversation.isPending}
                className="w-full"
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ConversationSidebar
            conversations={conversationsData?.items || []}
            currentConversationId={currentConversationId}
            onSelectConversation={setCurrentConversationId}
            onNewConversation={() => setNewConversationOpen(true)}
            onDeleteConversation={(id) => {
              if (
                confirm("Are you sure you want to delete this conversation?")
              ) {
                deleteConversation.mutate({ id });
              }
            }}
            className="h-[700px]"
          />
        </div>

        {/* Chat */}
        <div className="lg:col-span-3 space-y-6">
          {currentConversationId && currentConversation ? (
            <ChatInterface
              messages={
                currentConversation.messages.map((msg) => ({
                  ...msg,
                  createdAt: new Date(msg.createdAt),
                })) || []
              }
              models={models}
              selectedModel={currentConversation.modelId}
              onModelChange={handleModelChange}
              onSendMessage={handleSendMessage}
              isLoading={sendMessage.isPending}
              conversationTitle={currentConversation.title}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px] border-2 border-dashed rounded-lg">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">No conversation selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a conversation from the sidebar or create a new one
                </p>
                <Button onClick={() => setNewConversationOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Conversation
                </Button>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          {quota && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuotaMeter
                used={quota.used}
                limit={quota.limit}
              />
              {stats && (
                <UsageStats
                  totalCost={stats.totalCost}
                  totalTokens={stats.totalTokens}
                  totalMessages={stats.totalMessages}
                  byModel={stats.byModel}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
