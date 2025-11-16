import { or, ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, tenantProcedure } from "../init";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  aiConversations,
  aiMessages,
  aiModels,
  aiPromptTemplates,
  aiUsageStats,
} from "@/db/schema";
import {
  getOpenRouterClient,
  formatMessages,
  calculateCost,
  trackUsage,
  checkQuota,
  getUsageSummary,
} from "@/lib/openrouter";

/**
 * AI Router
 *
 * Provides endpoints for AI conversations, messages, models, templates, and usage tracking
 */
export const aiRouter = {
  // ============================================
  // CONVERSATIONS
  // ============================================

  conversations: or({
    /**
     * Create a new AI conversation
     */
    create: tenantProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          modelId: z.string(),
          systemPrompt: z.string().optional(),
          metadata: z
            .object({
              tags: z.array(z.string()).optional(),
              category: z.string().optional(),
              isStarred: z.boolean().optional(),
            })
            .optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        // Verify model exists
        const model = await db.query.aiModels.findFirst({
          where: and(
            eq(aiModels.modelId, input.modelId),
            eq(aiModels.isActive, true),
            eq(aiModels.isEnabled, true)
          ),
        });

        if (!model) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Invalid or disabled model",
          });
        }

        // Check quota before creating conversation
        const quotaLimit = Number(process.env.AI_MONTHLY_QUOTA_PER_TENANT) || 100;
        const quota = await checkQuota(tenant.id, quotaLimit);

        if (quota.exceeded) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: `Monthly AI quota exceeded. Used: $${quota.used.toFixed(2)}, Limit: $${quota.limit}`,
          });
        }

        const [conversation] = await db
          .insert(aiConversations)
          .values({
            userId: user.id,
            tenantId: tenant.id,
            title: input.title,
            modelId: input.modelId,
            systemPrompt: input.systemPrompt,
            metadata: input.metadata || {},
          })
          .returning();

        return conversation;
      }),

    /**
     * List user's conversations
     */
    list: tenantProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          includeArchived: z.boolean().default(false),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const conditions = [
          eq(aiConversations.userId, user.id),
          eq(aiConversations.tenantId, tenant.id),
        ];

        if (!input.includeArchived) {
          conditions.push(eq(aiConversations.isArchived, false));
        }

        const items = await db.query.aiConversations.findMany({
          where: and(...conditions),
          orderBy: [desc(aiConversations.updatedAt)],
          limit: input.limit,
          offset: input.offset,
        });

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(aiConversations)
          .where(and(...conditions));

        return {
          items,
          total: count,
          hasMore: input.offset + items.length < count,
        };
      }),

    /**
     * Get single conversation with messages
     */
    get: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const conversation = await db.query.aiConversations.findFirst({
          where: and(
            eq(aiConversations.id, input.id),
            eq(aiConversations.userId, user.id),
            eq(aiConversations.tenantId, tenant.id)
          ),
          with: {
            messages: {
              orderBy: [desc(aiMessages.createdAt)],
            },
          },
        });

        if (!conversation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        return conversation;
      }),

    /**
     * Update conversation
     */
    update: tenantProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().min(1).max(255).optional(),
          metadata: z
            .object({
              tags: z.array(z.string()).optional(),
              category: z.string().optional(),
              isStarred: z.boolean().optional(),
            })
            .optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const [updated] = await db
          .update(aiConversations)
          .set({
            title: input.title,
            metadata: input.metadata,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiConversations.id, input.id),
              eq(aiConversations.userId, user.id),
              eq(aiConversations.tenantId, tenant.id)
            )
          )
          .returning();

        if (!updated) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        return updated;
      }),

    /**
     * Archive conversation
     */
    archive: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const [archived] = await db
          .update(aiConversations)
          .set({
            isArchived: true,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiConversations.id, input.id),
              eq(aiConversations.userId, user.id),
              eq(aiConversations.tenantId, tenant.id)
            )
          )
          .returning();

        if (!archived) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        return { success: true };
      }),

    /**
     * Delete conversation
     */
    delete: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const [deleted] = await db
          .delete(aiConversations)
          .where(
            and(
              eq(aiConversations.id, input.id),
              eq(aiConversations.userId, user.id),
              eq(aiConversations.tenantId, tenant.id)
            )
          )
          .returning();

        if (!deleted) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        return { success: true };
      }),
  }),

  // ============================================
  // MESSAGES
  // ============================================

  messages: or({
    /**
     * Send a message (non-streaming)
     */
    send: tenantProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          content: z.string().min(1),
          temperature: z.number().min(0).max(2).optional(),
          maxTokens: z.number().min(1).max(32000).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        // Get conversation
        const conversation = await db.query.aiConversations.findFirst({
          where: and(
            eq(aiConversations.id, input.conversationId),
            eq(aiConversations.userId, user.id),
            eq(aiConversations.tenantId, tenant.id)
          ),
          with: {
            messages: {
              orderBy: [desc(aiMessages.createdAt)],
              limit: 20, // Last 20 messages for context
            },
          },
        });

        if (!conversation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        // Check quota
        const quotaLimit = Number(process.env.AI_MONTHLY_QUOTA_PER_TENANT) || 100;
        const quota = await checkQuota(tenant.id, quotaLimit);

        if (quota.exceeded) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: `Monthly AI quota exceeded. Used: $${quota.used.toFixed(2)}, Limit: $${quota.limit}`,
          });
        }

        // Get model pricing
        const model = await db.query.aiModels.findFirst({
          where: eq(aiModels.modelId, conversation.modelId),
        });

        if (!model) {
          throw new ORPCError({
            code: "BAD_REQUEST",
            message: "Model not found",
          });
        }

        // Build message history
        const messageHistory = [
          ...(conversation.systemPrompt
            ? [{ role: "system" as const, content: conversation.systemPrompt }]
            : []),
          ...conversation.messages
            .reverse()
            .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.content },
        ];

        // Save user message
        const [userMessage] = await db
          .insert(aiMessages)
          .values({
            conversationId: input.conversationId,
            role: "user",
            content: input.content,
            isStreamed: false,
          })
          .returning();

        // Call OpenRouter
        const client = getOpenRouterClient();
        const startTime = Date.now();

        try {
          const response = await client.createChatCompletion({
            model: conversation.modelId,
            messages: formatMessages(messageHistory),
            temperature: input.temperature,
            max_tokens: input.maxTokens,
          });

          const latencyMs = Date.now() - startTime;
          const assistantContent = response.choices[0].message.content;
          const usage = response.usage;

          // Calculate cost
          const cost = calculateCost(
            usage.prompt_tokens,
            usage.completion_tokens,
            Number(model.inputCostPer1kTokens),
            Number(model.outputCostPer1kTokens)
          );

          // Save assistant message
          const [assistantMessage] = await db
            .insert(aiMessages)
            .values({
              conversationId: input.conversationId,
              role: "assistant",
              content: assistantContent,
              modelId: conversation.modelId,
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
              cost: cost.toString(),
              metadata: {
                temperature: input.temperature,
                maxTokens: input.maxTokens,
                latencyMs,
              },
              isStreamed: false,
            })
            .returning();

          // Track usage
          await trackUsage(input.conversationId, {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            cost,
            modelId: conversation.modelId,
            latencyMs,
          });

          return {
            userMessage,
            assistantMessage,
            usage: {
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
              cost,
            },
          };
        } catch (error: any) {
          // Save error message
          await db.insert(aiMessages).values({
            conversationId: input.conversationId,
            role: "assistant",
            content: "Error: Failed to generate response",
            metadata: {
              error: error.message,
              latencyMs: Date.now() - startTime,
            },
            isStreamed: false,
          });

          throw new ORPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `AI generation failed: ${error.message}`,
          });
        }
      }),

    /**
     * List messages for a conversation
     */
    list: tenantProcedure
      .input(
        z.object({
          conversationId: z.string().uuid(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        // Verify conversation access
        const conversation = await db.query.aiConversations.findFirst({
          where: and(
            eq(aiConversations.id, input.conversationId),
            eq(aiConversations.userId, user.id),
            eq(aiConversations.tenantId, tenant.id)
          ),
        });

        if (!conversation) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Conversation not found",
          });
        }

        const items = await db.query.aiMessages.findMany({
          where: eq(aiMessages.conversationId, input.conversationId),
          orderBy: [desc(aiMessages.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        return {
          items: items.reverse(), // Return in chronological order
          hasMore: items.length === input.limit,
        };
      }),
  }),

  // ============================================
  // MODELS
  // ============================================

  models: or({
    /**
     * List available AI models
     */
    list: protectedProcedure
      .input(
        z.object({
          provider: z.string().optional(),
          capability: z.enum(["streaming", "functionCalling", "vision", "jsonMode"]).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;

        const conditions = [eq(aiModels.isActive, true), eq(aiModels.isEnabled, true)];

        if (input.provider) {
          conditions.push(eq(aiModels.provider, input.provider));
        }

        let models = await db.query.aiModels.findMany({
          where: and(...conditions),
          orderBy: [desc(aiModels.createdAt)],
        });

        // Filter by capability if specified
        if (input.capability) {
          models = models.filter((model) => {
            const caps = model.capabilities as any;
            return caps?.[input.capability] === true;
          });
        }

        return models;
      }),

    /**
     * Get single model details
     */
    get: protectedProcedure
      .input(z.object({ modelId: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const model = await db.query.aiModels.findFirst({
          where: eq(aiModels.modelId, input.modelId),
        });

        if (!model) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Model not found",
          });
        }

        return model;
      }),

    /**
     * Get recommended models for a use case
     */
    getRecommended: protectedProcedure
      .input(
        z.object({
          useCase: z.enum(["chat", "coding", "analysis", "creative", "vision"]),
          budget: z.enum(["low", "medium", "high"]).default("medium"),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;

        let models = await db.query.aiModels.findMany({
          where: and(eq(aiModels.isActive, true), eq(aiModels.isEnabled, true)),
        });

        // Filter by use case (based on tags)
        models = models.filter((model) => {
          const config = model.config as any;
          const tags = config?.tags || [];

          if (input.useCase === "vision") {
            const caps = model.capabilities as any;
            return caps?.vision === true;
          }

          return tags.includes(input.useCase);
        });

        // Sort by budget
        if (input.budget === "low") {
          models.sort(
            (a, b) =>
              Number(a.inputCostPer1kTokens) +
              Number(a.outputCostPer1kTokens) -
              (Number(b.inputCostPer1kTokens) + Number(b.outputCostPer1kTokens))
          );
        } else if (input.budget === "high") {
          models.sort(
            (a, b) =>
              Number(b.inputCostPer1kTokens) +
              Number(b.outputCostPer1kTokens) -
              (Number(a.inputCostPer1kTokens) + Number(a.outputCostPer1kTokens))
          );
        }

        return models.slice(0, 5); // Return top 5
      }),
  }),

  // ============================================
  // TEMPLATES
  // ============================================

  templates: or({
    /**
     * Create prompt template
     */
    create: tenantProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          category: z.string().optional(),
          systemPrompt: z.string().optional(),
          userPromptTemplate: z.string().min(1),
          variables: z
            .array(
              z.object({
                name: z.string(),
                description: z.string(),
                type: z.enum(["text", "number", "boolean", "select"]),
                required: z.boolean(),
                defaultValue: z.any().optional(),
                options: z.array(z.string()).optional(),
              })
            )
            .optional(),
          config: z
            .object({
              recommendedModel: z.string().optional(),
              temperature: z.number().optional(),
              maxTokens: z.number().optional(),
              tags: z.array(z.string()).optional(),
            })
            .optional(),
          isPublic: z.boolean().default(false),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user, tenant } = context;

        const [template] = await db
          .insert(aiPromptTemplates)
          .values({
            tenantId: tenant.id,
            userId: user.id,
            name: input.name,
            description: input.description,
            category: input.category,
            systemPrompt: input.systemPrompt,
            userPromptTemplate: input.userPromptTemplate,
            variables: input.variables || [],
            config: input.config || {},
            isPublic: input.isPublic,
          })
          .returning();

        return template;
      }),

    /**
     * List templates
     */
    list: tenantProcedure
      .input(
        z.object({
          category: z.string().optional(),
          includePublic: z.boolean().default(true),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const conditions = [];

        // Tenant-specific or public templates
        if (input.includePublic) {
          conditions.push(
            sql`(${aiPromptTemplates.tenantId} = ${tenant.id} OR ${aiPromptTemplates.isPublic} = true)`
          );
        } else {
          conditions.push(eq(aiPromptTemplates.tenantId, tenant.id));
        }

        if (input.category) {
          conditions.push(eq(aiPromptTemplates.category, input.category));
        }

        const templates = await db.query.aiPromptTemplates.findMany({
          where: and(...conditions),
          orderBy: [desc(aiPromptTemplates.usageCount)],
        });

        return templates;
      }),

    /**
     * Get template details
     */
    get: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const template = await db.query.aiPromptTemplates.findFirst({
          where: and(
            eq(aiPromptTemplates.id, input.id),
            sql`(${aiPromptTemplates.tenantId} = ${tenant.id} OR ${aiPromptTemplates.isPublic} = true)`
          ),
        });

        if (!template) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        return template;
      }),

    /**
     * Use template with variables
     */
    use: tenantProcedure
      .input(
        z.object({
          templateId: z.string().uuid(),
          variables: z.record(z.any()),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const template = await db.query.aiPromptTemplates.findFirst({
          where: and(
            eq(aiPromptTemplates.id, input.templateId),
            sql`(${aiPromptTemplates.tenantId} = ${tenant.id} OR ${aiPromptTemplates.isPublic} = true)`
          ),
        });

        if (!template) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        // Replace variables in template
        let prompt = template.userPromptTemplate;
        for (const [key, value] of Object.entries(input.variables)) {
          prompt = prompt.replace(new RegExp(`{{${key}}}`, "g"), String(value));
        }

        // Increment usage count
        await db
          .update(aiPromptTemplates)
          .set({
            usageCount: sql`${aiPromptTemplates.usageCount} + 1`,
          })
          .where(eq(aiPromptTemplates.id, input.templateId));

        return {
          systemPrompt: template.systemPrompt,
          userPrompt: prompt,
          config: template.config,
        };
      }),

    /**
     * Update template
     */
    update: tenantProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          userPromptTemplate: z.string().optional(),
          variables: z.array(z.any()).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const [updated] = await db
          .update(aiPromptTemplates)
          .set({
            name: input.name,
            description: input.description,
            userPromptTemplate: input.userPromptTemplate,
            variables: input.variables,
            updatedAt: new Date(),
          })
          .where(
            and(eq(aiPromptTemplates.id, input.id), eq(aiPromptTemplates.tenantId, tenant.id))
          )
          .returning();

        if (!updated) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }

        return updated;
      }),

    /**
     * Delete template
     */
    delete: tenantProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const [deleted] = await db
          .delete(aiPromptTemplates)
          .where(
            and(eq(aiPromptTemplates.id, input.id), eq(aiPromptTemplates.tenantId, tenant.id))
          )
          .returning();

        if (!deleted) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Template not found or access denied",
          });
        }

        return { success: true };
      }),
  }),

  // ============================================
  // USAGE & QUOTAS
  // ============================================

  usage: or({
    /**
     * Get usage statistics
     */
    getStats: tenantProcedure
      .input(
        z.object({
          period: z.enum(["daily", "monthly", "yearly"]).default("monthly"),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { tenant } = context;

        const now = new Date();
        let startDate = input.startDate;
        const endDate = input.endDate || now;

        if (!startDate) {
          if (input.period === "daily") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          } else if (input.period === "monthly") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          } else {
            startDate = new Date(now.getFullYear(), 0, 1);
          }
        }

        const summary = await getUsageSummary(tenant.id, startDate, endDate);

        return {
          period: input.period,
          startDate,
          endDate,
          ...summary,
        };
      }),

    /**
     * Get quota status
     */
    getQuota: tenantProcedure.handler(async ({ context }) => {
      const { tenant } = context;

      const quotaLimit = Number(process.env.AI_MONTHLY_QUOTA_PER_TENANT) || 100;
      const quota = await checkQuota(tenant.id, quotaLimit);

      return quota;
    }),

    /**
     * Get cost breakdown
     */
    getCosts: tenantProcedure
      .input(
        z.object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const now = new Date();
        const startDate = input.startDate || new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = input.endDate || now;

        const conversations = await db.query.aiConversations.findMany({
          where: and(
            eq(aiConversations.tenantId, tenant.id),
            sql`${aiConversations.createdAt} >= ${startDate}`,
            sql`${aiConversations.createdAt} <= ${endDate}`
          ),
          orderBy: [desc(aiConversations.totalCost)],
        });

        const totalCost = conversations.reduce(
          (sum, conv) => sum + Number(conv.totalCost),
          0
        );

        return {
          startDate,
          endDate,
          totalCost,
          conversationCount: conversations.length,
          conversations: conversations.map((conv) => ({
            id: conv.id,
            title: conv.title,
            modelId: conv.modelId,
            messageCount: conv.messageCount,
            totalTokens: conv.totalTokens,
            totalCost: Number(conv.totalCost),
          })),
        };
      }),
  }),
};
