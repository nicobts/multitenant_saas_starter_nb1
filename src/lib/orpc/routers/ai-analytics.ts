import { or, ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
  adminRoles,
  aiConversations,
  aiMessages,
  aiUsageStats,
  aiCredits,
  aiCreditTransactions,
  aiModels,
  tenants,
} from "@/db/schema";

// Super admin middleware
const superAdminProcedure = protectedProcedure.use(async (input, context, meta) => {
  const { db, user } = context;

  // Check if user is super admin
  const adminRole = await db.query.adminRoles.findFirst({
    where: and(eq(adminRoles.userId, user.id), eq(adminRoles.isActive, true)),
  });

  if (!adminRole || adminRole.role !== "super_admin") {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "Super admin access required",
    });
  }

  return { adminRole };
});

export const aiAnalyticsRouter = {
  /**
   * Get platform overview stats
   */
  getOverview: superAdminProcedure.handler(async ({ context }) => {
    const { db } = context;

    // Total conversations
    const [{ totalConversations }] = await db
      .select({ totalConversations: sql<number>`count(*)::int` })
      .from(aiConversations);

    // Total messages
    const [{ totalMessages }] = await db
      .select({ totalMessages: sql<number>`count(*)::int` })
      .from(aiMessages);

    // Total credits balance across all tenants
    const [{ totalBalance }] = await db
      .select({
        totalBalance: sql<number>`COALESCE(SUM(CAST(${aiCredits.balance} AS NUMERIC)), 0)`
      })
      .from(aiCredits);

    // Total lifetime spent
    const [{ totalSpent }] = await db
      .select({
        totalSpent: sql<number>`COALESCE(SUM(CAST(${aiCredits.lifetimeSpent} AS NUMERIC)), 0)`
      })
      .from(aiCredits);

    // Total lifetime purchased
    const [{ totalPurchased }] = await db
      .select({
        totalPurchased: sql<number>`COALESCE(SUM(CAST(${aiCredits.lifetimePurchased} AS NUMERIC)), 0)`
      })
      .from(aiCredits);

    // Active tenants (tenants with conversations)
    const [{ activeTenants }] = await db
      .select({ activeTenants: sql<number>`count(DISTINCT ${aiConversations.tenantId})::int` })
      .from(aiConversations);

    return {
      totalConversations,
      totalMessages,
      totalBalance: Number(totalBalance || 0),
      totalSpent: Number(totalSpent || 0),
      totalPurchased: Number(totalPurchased || 0),
      revenue: Number(totalPurchased || 0),
      activeTenants,
    };
  }),

  /**
   * Get usage by model
   */
  getUsageByModel: superAdminProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const conditions = [];

      if (input.startDate) {
        conditions.push(gte(aiUsageStats.periodStart, input.startDate));
      }

      if (input.endDate) {
        conditions.push(lte(aiUsageStats.periodEnd, input.endDate));
      }

      const usageByModel = await db
        .select({
          modelId: aiUsageStats.modelId,
          totalRequests: sql<number>`SUM(${aiUsageStats.requestCount})::int`,
          totalMessages: sql<number>`SUM(${aiUsageStats.messageCount})::int`,
          totalTokens: sql<number>`SUM(${aiUsageStats.totalTokens})::int`,
          totalCost: sql<number>`COALESCE(SUM(CAST(${aiUsageStats.totalCost} AS NUMERIC)), 0)`,
        })
        .from(aiUsageStats)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(aiUsageStats.modelId)
        .orderBy(desc(sql`SUM(${aiUsageStats.requestCount})`));

      return usageByModel.map((item) => ({
        ...item,
        totalCost: Number(item.totalCost),
      }));
    }),

  /**
   * Get top tenants by usage
   */
  getTopTenants: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        sortBy: z.enum(["cost", "messages", "conversations"]).default("cost"),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const tenantStats = await db
        .select({
          tenantId: aiCredits.tenantId,
          lifetimeSpent: aiCredits.lifetimeSpent,
          lifetimePurchased: aiCredits.lifetimePurchased,
          balance: aiCredits.balance,
        })
        .from(aiCredits)
        .orderBy(desc(aiCredits.lifetimeSpent))
        .limit(input.limit);

      // Get additional stats for each tenant
      const enrichedStats = await Promise.all(
        tenantStats.map(async (stat) => {
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, stat.tenantId),
          });

          const [{ messageCount }] = await db
            .select({ messageCount: sql<number>`count(*)::int` })
            .from(aiMessages)
            .leftJoin(aiConversations, eq(aiMessages.conversationId, aiConversations.id))
            .where(eq(aiConversations.tenantId, stat.tenantId));

          const [{ conversationCount }] = await db
            .select({ conversationCount: sql<number>`count(*)::int` })
            .from(aiConversations)
            .where(eq(aiConversations.tenantId, stat.tenantId));

          return {
            tenantId: stat.tenantId,
            tenantName: tenant?.name || "Unknown",
            lifetimeSpent: Number(stat.lifetimeSpent),
            lifetimePurchased: Number(stat.lifetimePurchased),
            balance: Number(stat.balance),
            messageCount,
            conversationCount,
          };
        })
      );

      return enrichedStats;
    }),

  /**
   * Get revenue trends
   */
  getRevenueTrends: superAdminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const transactions = await db
        .select({
          date: sql<string>`DATE(${aiCreditTransactions.createdAt})`,
          revenue: sql<number>`COALESCE(SUM(CASE WHEN ${aiCreditTransactions.type} = 'purchase' THEN CAST(${aiCreditTransactions.amount} AS NUMERIC) ELSE 0 END), 0)`,
          usage: sql<number>`COALESCE(SUM(CASE WHEN ${aiCreditTransactions.type} = 'usage' THEN ABS(CAST(${aiCreditTransactions.amount} AS NUMERIC)) ELSE 0 END), 0)`,
        })
        .from(aiCreditTransactions)
        .where(gte(aiCreditTransactions.createdAt, startDate))
        .groupBy(sql`DATE(${aiCreditTransactions.createdAt})`)
        .orderBy(sql`DATE(${aiCreditTransactions.createdAt})`);

      return transactions.map((item) => ({
        date: item.date,
        revenue: Number(item.revenue),
        usage: Number(item.usage),
      }));
    }),

  /**
   * Get model popularity
   */
  getModelPopularity: superAdminProcedure.handler(async ({ context }) => {
    const { db } = context;

    const modelStats = await db
      .select({
        modelId: aiConversations.modelId,
        conversationCount: sql<number>`count(*)::int`,
        messageCount: sql<number>`COALESCE(SUM(${aiConversations.messageCount}), 0)::int`,
        totalCost: sql<number>`COALESCE(SUM(CAST(${aiConversations.totalCost} AS NUMERIC)), 0)`,
      })
      .from(aiConversations)
      .groupBy(aiConversations.modelId)
      .orderBy(desc(sql`count(*)`));

    return modelStats.map((item) => ({
      ...item,
      totalCost: Number(item.totalCost),
    }));
  }),

  /**
   * Get recent activity
   */
  getRecentActivity: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const recentConversations = await db
        .select({
          id: aiConversations.id,
          title: aiConversations.title,
          tenantId: aiConversations.tenantId,
          modelId: aiConversations.modelId,
          messageCount: aiConversations.messageCount,
          totalCost: aiConversations.totalCost,
          createdAt: aiConversations.createdAt,
          lastMessageAt: aiConversations.lastMessageAt,
        })
        .from(aiConversations)
        .orderBy(desc(aiConversations.updatedAt))
        .limit(input.limit);

      // Enrich with tenant info
      const enriched = await Promise.all(
        recentConversations.map(async (conv) => {
          const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, conv.tenantId),
          });

          return {
            ...conv,
            totalCost: Number(conv.totalCost),
            tenantName: tenant?.name || "Unknown",
          };
        })
      );

      return enriched;
    }),

  /**
   * Get system health metrics
   */
  getSystemHealth: superAdminProcedure.handler(async ({ context }) => {
    const { db } = context;

    // Messages in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const [{ messagesLast24h }] = await db
      .select({ messagesLast24h: sql<number>`count(*)::int` })
      .from(aiMessages)
      .where(gte(aiMessages.createdAt, oneDayAgo));

    // Average cost per message
    const [{ avgCostPerMessage }] = await db
      .select({
        avgCostPerMessage: sql<number>`COALESCE(AVG(CAST(${aiMessages.cost} AS NUMERIC)), 0)`
      })
      .from(aiMessages)
      .where(and(
        sql`${aiMessages.cost} IS NOT NULL`,
        sql`CAST(${aiMessages.cost} AS NUMERIC) > 0`
      ));

    // Error rate (messages with error metadata)
    const [{ totalRecentMessages }] = await db
      .select({ totalRecentMessages: sql<number>`count(*)::int` })
      .from(aiMessages)
      .where(gte(aiMessages.createdAt, oneDayAgo));

    const [{ errorMessages }] = await db
      .select({ errorMessages: sql<number>`count(*)::int` })
      .from(aiMessages)
      .where(and(
        gte(aiMessages.createdAt, oneDayAgo),
        sql`${aiMessages.metadata}->>'error' IS NOT NULL`
      ));

    const errorRate = totalRecentMessages > 0
      ? (errorMessages / totalRecentMessages) * 100
      : 0;

    // Average tokens per message
    const [{ avgTokensPerMessage }] = await db
      .select({
        avgTokensPerMessage: sql<number>`COALESCE(AVG(${aiMessages.totalTokens}), 0)::int`
      })
      .from(aiMessages)
      .where(sql`${aiMessages.totalTokens} IS NOT NULL`);

    return {
      messagesLast24h,
      avgCostPerMessage: Number(avgCostPerMessage || 0),
      errorRate: Number(errorRate.toFixed(2)),
      avgTokensPerMessage: avgTokensPerMessage || 0,
    };
  }),
};
