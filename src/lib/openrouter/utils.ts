/**
 * OpenRouter Utilities
 *
 * Helper functions for cost calculation, usage tracking, and token management
 */

import { db } from "@/db";
import { aiUsageStats, aiConversations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export interface UsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  modelId: string;
  latencyMs?: number;
}

/**
 * Calculate cost based on token usage and model pricing
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number
): number {
  const promptCost = (promptTokens / 1000) * inputCostPer1k;
  const completionCost = (completionTokens / 1000) * outputCostPer1k;
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Track usage for a conversation
 * Updates the conversation's total tokens and cost
 */
export async function trackUsage(
  conversationId: string,
  metrics: UsageMetrics
): Promise<void> {
  await db
    .update(aiConversations)
    .set({
      totalTokens: sql`${aiConversations.totalTokens} + ${metrics.totalTokens}`,
      totalCost: sql`${aiConversations.totalCost} + ${metrics.cost}`,
      messageCount: sql`${aiConversations.messageCount} + 1`,
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    })
    .where(eq(aiConversations.id, conversationId));
}

/**
 * Aggregate usage stats for a tenant (for billing)
 * Call this periodically (e.g., via cron job) to update usage statistics
 */
export async function aggregateUsageStats(
  tenantId: string,
  period: "daily" | "monthly" | "yearly",
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  // Get all conversations for the tenant in this period
  const conversations = await db.query.aiConversations.findMany({
    where: and(
      eq(aiConversations.tenantId, tenantId),
      sql`${aiConversations.createdAt} >= ${periodStart}`,
      sql`${aiConversations.createdAt} < ${periodEnd}`
    ),
    with: {
      messages: true,
    },
  });

  // Aggregate by model
  const modelStats = new Map<
    string,
    {
      requestCount: number;
      messageCount: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      totalCost: number;
    }
  >();

  for (const conversation of conversations) {
    const modelId = conversation.modelId;

    if (!modelStats.has(modelId)) {
      modelStats.set(modelId, {
        requestCount: 0,
        messageCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      });
    }

    const stats = modelStats.get(modelId)!;
    stats.requestCount += 1;
    stats.messageCount += conversation.messageCount;
    stats.totalTokens += conversation.totalTokens;
    stats.totalCost += Number(conversation.totalCost);

    // Sum up tokens from messages
    for (const message of conversation.messages) {
      if (message.promptTokens) {
        stats.promptTokens += message.promptTokens;
      }
      if (message.completionTokens) {
        stats.completionTokens += message.completionTokens;
      }
    }
  }

  // Insert or update stats
  for (const [modelId, stats] of modelStats.entries()) {
    await db
      .insert(aiUsageStats)
      .values({
        tenantId,
        modelId,
        period,
        periodStart,
        periodEnd,
        requestCount: stats.requestCount,
        messageCount: stats.messageCount,
        promptTokens: stats.promptTokens,
        completionTokens: stats.completionTokens,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost.toString(),
      })
      .onConflictDoUpdate({
        target: [
          aiUsageStats.tenantId,
          aiUsageStats.modelId,
          aiUsageStats.period,
          aiUsageStats.periodStart,
        ],
        set: {
          requestCount: stats.requestCount,
          messageCount: stats.messageCount,
          promptTokens: stats.promptTokens,
          completionTokens: stats.completionTokens,
          totalTokens: stats.totalTokens,
          totalCost: stats.totalCost.toString(),
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Get usage summary for a tenant
 */
export async function getUsageSummary(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{
  totalCost: number;
  totalTokens: number;
  totalMessages: number;
  byModel: Record<
    string,
    {
      cost: number;
      tokens: number;
      messages: number;
    }
  >;
}> {
  const stats = await db.query.aiUsageStats.findMany({
    where: and(
      eq(aiUsageStats.tenantId, tenantId),
      sql`${aiUsageStats.periodStart} >= ${periodStart}`,
      sql`${aiUsageStats.periodEnd} <= ${periodEnd}`
    ),
  });

  let totalCost = 0;
  let totalTokens = 0;
  let totalMessages = 0;
  const byModel: Record<
    string,
    { cost: number; tokens: number; messages: number }
  > = {};

  for (const stat of stats) {
    const cost = Number(stat.totalCost);
    totalCost += cost;
    totalTokens += stat.totalTokens;
    totalMessages += stat.messageCount;

    if (!byModel[stat.modelId]) {
      byModel[stat.modelId] = { cost: 0, tokens: 0, messages: 0 };
    }

    byModel[stat.modelId].cost += cost;
    byModel[stat.modelId].tokens += stat.totalTokens;
    byModel[stat.modelId].messages += stat.messageCount;
  }

  return {
    totalCost,
    totalTokens,
    totalMessages,
    byModel,
  };
}

/**
 * Check if tenant has exceeded their AI usage quota
 */
export async function checkQuota(
  tenantId: string,
  monthlyLimit: number
): Promise<{
  exceeded: boolean;
  used: number;
  limit: number;
  remaining: number;
}> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const summary = await getUsageSummary(tenantId, monthStart, monthEnd);

  return {
    exceeded: summary.totalCost >= monthlyLimit,
    used: summary.totalCost,
    limit: monthlyLimit,
    remaining: Math.max(0, monthlyLimit - summary.totalCost),
  };
}
