/**
 * OpenRouter API Client
 *
 * Provides type-safe access to 100+ AI models through OpenRouter's unified API
 * Supports streaming, function calling, vision, and more.
 *
 * @see https://openrouter.ai/docs
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
      url: string;
      detail?: "low" | "high" | "auto";
    };
  }>;
  name?: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
  seed?: number;
  max_tokens?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  response_format?: { type: "json_object" };
  stop?: string | string[];
  tools?: any[];
  tool_choice?: "none" | "auto" | { type: "function"; function: { name: string } };
  transforms?: string[];
  models?: string[];
  route?: "fallback";
  provider?: {
    order?: string[];
    allow_fallbacks?: boolean;
    require_parameters?: boolean;
    data_collection?: "allow" | "deny";
  };
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  object: "chat.completion";
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: "assistant";
      content: string;
      tool_calls?: any[];
    };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter";
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

export interface OpenRouterStreamChunk {
  id: string;
  model: string;
  object: "chat.completion.chunk";
  created: number;
  choices: Array<{
    index: number;
    delta: {
      role?: "assistant";
      content?: string;
      tool_calls?: any[];
    };
    finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  }>;
}

export interface OpenRouterError {
  error: {
    code: number;
    message: string;
    metadata?: {
      provider_name?: string;
      raw?: string;
    };
  };
}

export interface OpenRouterGenerationInfo {
  id: string;
  model: string;
  streamed: boolean;
  generation_time: number;
  tokens_prompt: number;
  tokens_completion: number;
  native_tokens_prompt?: number;
  native_tokens_completion?: number;
  num_media_generations?: number;
  cost?: number;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string = "https://openrouter.ai/api/v1";
  private appName?: string;
  private appUrl?: string;

  constructor(config: {
    apiKey: string;
    appName?: string;
    appUrl?: string;
  }) {
    this.apiKey = config.apiKey;
    this.appName = config.appName;
    this.appUrl = config.appUrl;
  }

  /**
   * Create a chat completion (non-streaming)
   */
  async createChatCompletion(
    request: OpenRouterRequest
  ): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error: OpenRouterError = await response.json();
      throw new Error(
        `OpenRouter API Error: ${error.error.message} (Code: ${error.error.code})`
      );
    }

    return response.json();
  }

  /**
   * Create a streaming chat completion
   * Returns an async generator that yields chunks as they arrive
   */
  async *createStreamingChatCompletion(
    request: OpenRouterRequest
  ): AsyncGenerator<OpenRouterStreamChunk, void, unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error: OpenRouterError = await response.json();
      throw new Error(
        `OpenRouter API Error: ${error.error.message} (Code: ${error.error.code})`
      );
    }

    if (!response.body) {
      throw new Error("No response body received from OpenRouter");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
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

          if (!trimmedLine || trimmedLine === "data: [DONE]") {
            continue;
          }

          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const chunk: OpenRouterStreamChunk = JSON.parse(jsonStr);
              yield chunk;
            } catch (e) {
              console.error("Failed to parse SSE chunk:", trimmedLine, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get generation info for a request
   * This provides detailed information about token usage and costs
   */
  async getGenerationInfo(
    generationId: string
  ): Promise<OpenRouterGenerationInfo> {
    const response = await fetch(
      `${this.baseUrl}/generation?id=${generationId}`,
      {
        method: "GET",
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error: OpenRouterError = await response.json();
      throw new Error(
        `OpenRouter API Error: ${error.error.message} (Code: ${error.error.code})`
      );
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get available models
   */
  async getModels(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch models from OpenRouter");
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Calculate estimated cost for a request
   * This is an estimate - use getGenerationInfo() for actual costs
   */
  calculateEstimatedCost(
    promptTokens: number,
    completionTokens: number,
    inputCostPer1k: number,
    outputCostPer1k: number
  ): number {
    const promptCost = (promptTokens / 1000) * inputCostPer1k;
    const completionCost = (completionTokens / 1000) * outputCostPer1k;
    return promptCost + completionCost;
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (this.appName) {
      headers["X-Title"] = this.appName;
    }

    if (this.appUrl) {
      headers["HTTP-Referer"] = this.appUrl;
    }

    return headers;
  }
}

/**
 * Create a singleton instance of the OpenRouter client
 */
let openRouterInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!openRouterInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY environment variable is not set. " +
        "Get your API key from https://openrouter.ai/keys"
      );
    }

    openRouterInstance = new OpenRouterClient({
      apiKey,
      appName: process.env.NEXT_PUBLIC_APP_NAME,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });
  }

  return openRouterInstance;
}

/**
 * Helper function to count tokens (approximate)
 * For accurate counts, use the actual model's tokenizer
 * This is a simple approximation: 1 token ≈ 4 characters
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Helper to format messages for OpenRouter
 */
export function formatMessages(
  messages: Array<{ role: string; content: string }>
): OpenRouterMessage[] {
  return messages.map((msg) => ({
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content,
  }));
}
