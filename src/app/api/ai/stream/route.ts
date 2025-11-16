import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { aiConversations, aiMessages, aiModels } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  getOpenRouterClient,
  formatMessages,
  calculateCost,
  trackUsage,
} from "@/lib/openrouter";

/**
 * Streaming AI Messages Endpoint
 *
 * Uses Server-Sent Events (SSE) to stream AI responses token-by-token
 *
 * POST /api/ai/stream
 * Body: { conversationId: string, content: string, temperature?: number, maxTokens?: number }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { conversationId, content, temperature, maxTokens } = body;

    if (!conversationId || !content) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Get conversation with tenant check
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.userId, session.user.id)
      ),
      with: {
        messages: {
          orderBy: [desc(aiMessages.createdAt)],
          limit: 20,
        },
      },
    });

    if (!conversation) {
      return new Response("Conversation not found", { status: 404 });
    }

    // Get model
    const model = await db.query.aiModels.findFirst({
      where: eq(aiModels.modelId, conversation.modelId),
    });

    if (!model) {
      return new Response("Model not found", { status: 404 });
    }

    // Save user message
    const [userMessage] = await db
      .insert(aiMessages)
      .values({
        conversationId,
        role: "user",
        content,
        isStreamed: false,
      })
      .returning();

    // Build message history
    const messageHistory = [
      ...(conversation.systemPrompt
        ? [{ role: "system" as const, content: conversation.systemPrompt }]
        : []),
      ...conversation.messages
        .reverse()
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content },
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now();
        let fullResponse = "";
        let promptTokens = 0;
        let completionTokens = 0;

        try {
          const client = getOpenRouterClient();
          const aiStream = client.createStreamingChatCompletion({
            model: conversation.modelId,
            messages: formatMessages(messageHistory),
            temperature: temperature || 0.7,
            max_tokens: maxTokens,
          });

          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
          );

          // Stream tokens
          for await (const chunk of aiStream) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              fullResponse += delta.content;

              // Send token event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "token",
                    content: delta.content,
                  })}\n\n`
                )
              );
            }

            // Check for finish
            if (chunk.choices[0]?.finish_reason) {
              // Estimate tokens (will be replaced with actual when we save)
              promptTokens = Math.ceil(
                messageHistory.reduce((acc, m) => acc + m.content.length, 0) / 4
              );
              completionTokens = Math.ceil(fullResponse.length / 4);
            }
          }

          const latencyMs = Date.now() - startTime;

          // Calculate cost
          const cost = calculateCost(
            promptTokens,
            completionTokens,
            Number(model.inputCostPer1kTokens),
            Number(model.outputCostPer1kTokens)
          );

          // Save assistant message
          const [assistantMessage] = await db
            .insert(aiMessages)
            .values({
              conversationId,
              role: "assistant",
              content: fullResponse,
              modelId: conversation.modelId,
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
              cost: cost.toString(),
              metadata: {
                temperature,
                maxTokens,
                latencyMs,
              },
              isStreamed: true,
            })
            .returning();

          // Track usage
          await trackUsage(conversationId, {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            cost,
            modelId: conversation.modelId,
            latencyMs,
          });

          // Send completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                messageId: assistantMessage.id,
                usage: {
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens,
                  cost,
                },
              })}\n\n`
            )
          );

          controller.close();
        } catch (error: any) {
          console.error("Streaming error:", error);

          // Save error message
          await db.insert(aiMessages).values({
            conversationId,
            role: "assistant",
            content: "Error: Failed to generate response",
            metadata: {
              error: error.message,
              latencyMs: Date.now() - startTime,
            },
            isStreamed: true,
          });

          // Send error event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                error: error.message,
              })}\n\n`
            )
          );

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API error:", error);
    return new Response(error.message, { status: 500 });
  }
}
