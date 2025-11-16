import { useState, useCallback } from "react";

export interface StreamingMessageOptions {
  conversationId: string;
  content: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamingMessageState {
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  } | null;
  messageId: string | null;
}

export function useStreamingMessage() {
  const [state, setState] = useState<StreamingMessageState>({
    isStreaming: false,
    streamedContent: "",
    error: null,
    usage: null,
    messageId: null,
  });

  const sendStreamingMessage = useCallback(
    async (options: StreamingMessageOptions) => {
      setState({
        isStreaming: true,
        streamedContent: "",
        error: null,
        usage: null,
        messageId: null,
      });

      try {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(options),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (!trimmedLine || !trimmedLine.startsWith("data: ")) {
              continue;
            }

            try {
              const jsonStr = trimmedLine.slice(6);
              const event = JSON.parse(jsonStr);

              if (event.type === "start") {
                // Stream started
                setState((prev) => ({ ...prev, isStreaming: true }));
              } else if (event.type === "token") {
                // New token received
                setState((prev) => ({
                  ...prev,
                  streamedContent: prev.streamedContent + event.content,
                }));
              } else if (event.type === "done") {
                // Stream completed
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  usage: event.usage,
                  messageId: event.messageId,
                }));
              } else if (event.type === "error") {
                // Error occurred
                setState((prev) => ({
                  ...prev,
                  isStreaming: false,
                  error: event.error,
                }));
              }
            } catch (e) {
              console.error("Failed to parse SSE event:", trimmedLine, e);
            }
          }
        }
      } catch (error: any) {
        console.error("Streaming error:", error);
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error.message,
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      streamedContent: "",
      error: null,
      usage: null,
      messageId: null,
    });
  }, []);

  return {
    ...state,
    sendStreamingMessage,
    reset,
  };
}
