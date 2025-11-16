import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, decimal, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { tenants } from "./tenants";

/**
 * AI Conversations
 * Stores conversation threads between users and AI models
 */
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    modelId: varchar("model_id", { length: 100 }).notNull(), // e.g., "openai/gpt-4-turbo"
    systemPrompt: text("system_prompt"), // Optional system prompt for the conversation
    metadata: jsonb("metadata").$type<{
      tags?: string[];
      category?: string;
      isStarred?: boolean;
      customSettings?: Record<string, any>;
    }>().default({}),
    messageCount: integer("message_count").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    totalCost: decimal("total_cost", { precision: 10, scale: 6 }).notNull().default("0"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at"),
  },
  (table) => ({
    userIdIdx: index("ai_conversations_user_id_idx").on(table.userId),
    tenantIdIdx: index("ai_conversations_tenant_id_idx").on(table.tenantId),
    updatedAtIdx: index("ai_conversations_updated_at_idx").on(table.updatedAt),
  })
);

/**
 * AI Messages
 * Individual messages within conversations
 */
export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(), // "user", "assistant", "system"
    content: text("content").notNull(),
    modelId: varchar("model_id", { length: 100 }), // Model used for this specific message
    promptTokens: integer("prompt_tokens").default(0),
    completionTokens: integer("completion_tokens").default(0),
    totalTokens: integer("total_tokens").default(0),
    cost: decimal("cost", { precision: 10, scale: 6 }).default("0"),
    metadata: jsonb("metadata").$type<{
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      stopSequences?: string[];
      functionCall?: any;
      toolCalls?: any[];
      images?: string[]; // URLs or base64 encoded images for vision models
      error?: string;
      latencyMs?: number;
    }>().default({}),
    isStreamed: boolean("is_streamed").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdIdx: index("ai_messages_conversation_id_idx").on(table.conversationId),
    createdAtIdx: index("ai_messages_created_at_idx").on(table.createdAt),
  })
);

/**
 * AI Usage Stats
 * Aggregated usage statistics per tenant for billing and analytics
 */
export const aiUsageStats = pgTable(
  "ai_usage_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    modelId: varchar("model_id", { length: 100 }).notNull(),
    period: varchar("period", { length: 20 }).notNull(), // "daily", "monthly", "yearly"
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    messageCount: integer("message_count").notNull().default(0),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    totalCost: decimal("total_cost", { precision: 10, scale: 6 }).notNull().default("0"),
    metadata: jsonb("metadata").$type<{
      breakdown?: {
        conversationId: string;
        tokens: number;
        cost: number;
      }[];
      averageLatency?: number;
      errorCount?: number;
    }>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("ai_usage_stats_tenant_id_idx").on(table.tenantId),
    periodIdx: index("ai_usage_stats_period_idx").on(table.period, table.periodStart),
    modelIdIdx: index("ai_usage_stats_model_id_idx").on(table.modelId),
  })
);

/**
 * AI Models
 * Available AI models and their configuration
 */
export const aiModels = pgTable("ai_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  modelId: varchar("model_id", { length: 100 }).notNull().unique(), // OpenRouter model ID
  name: varchar("name", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 100 }).notNull(), // "openai", "anthropic", "google", etc.
  description: text("description"),
  contextWindow: integer("context_window").notNull(),
  maxOutputTokens: integer("max_output_tokens"),
  inputCostPer1kTokens: decimal("input_cost_per_1k_tokens", { precision: 10, scale: 6 }).notNull(),
  outputCostPer1kTokens: decimal("output_cost_per_1k_tokens", { precision: 10, scale: 6 }).notNull(),
  capabilities: jsonb("capabilities").$type<{
    streaming?: boolean;
    functionCalling?: boolean;
    vision?: boolean;
    jsonMode?: boolean;
  }>().default({}),
  config: jsonb("config").$type<{
    defaultTemperature?: number;
    defaultMaxTokens?: number;
    supportedLanguages?: string[];
    tags?: string[];
  }>().default({}),
  isActive: boolean("is_active").notNull().default(true),
  isEnabled: boolean("is_enabled").notNull().default(true), // Can be disabled globally
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * AI Prompt Templates
 * Reusable prompt templates for common use cases
 */
export const aiPromptTemplates = pgTable(
  "ai_prompt_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), // null for global templates
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // Creator
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }), // "code", "writing", "analysis", "creative", etc.
    systemPrompt: text("system_prompt"),
    userPromptTemplate: text("user_prompt_template").notNull(), // Template with {{variables}}
    variables: jsonb("variables").$type<{
      name: string;
      description: string;
      type: "text" | "number" | "boolean" | "select";
      required: boolean;
      defaultValue?: any;
      options?: string[]; // For select type
    }[]>().default([]),
    config: jsonb("config").$type<{
      recommendedModel?: string;
      temperature?: number;
      maxTokens?: number;
      tags?: string[];
    }>().default({}),
    isPublic: boolean("is_public").notNull().default(false), // Public templates visible to all tenants
    usageCount: integer("usage_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("ai_prompt_templates_tenant_id_idx").on(table.tenantId),
    categoryIdx: index("ai_prompt_templates_category_idx").on(table.category),
    isPublicIdx: index("ai_prompt_templates_is_public_idx").on(table.isPublic),
  })
);

// Relations
export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [aiConversations.tenantId],
    references: [tenants.id],
  }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const aiUsageStatsRelations = relations(aiUsageStats, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiUsageStats.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [aiUsageStats.userId],
    references: [users.id],
  }),
}));

export const aiPromptTemplatesRelations = relations(aiPromptTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiPromptTemplates.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [aiPromptTemplates.userId],
    references: [users.id],
  }),
}));
