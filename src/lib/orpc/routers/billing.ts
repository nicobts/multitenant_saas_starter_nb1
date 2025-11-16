import { or, ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, tenantProcedure } from "../init";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  aiCredits,
  aiCreditPackages,
  aiCreditTransactions,
  stripeCustomers,
  stripeSubscriptions,
} from "@/db/schema";

/**
 * Billing Router
 *
 * Manages AI credits, packages, transactions, and Stripe integration
 */
export const billingRouter = {
  // ============================================
  // CREDITS
  // ============================================

  credits: or({
    /**
     * Get credit balance for current tenant
     */
    getBalance: tenantProcedure.handler(async ({ context }) => {
      const { db, tenant } = context;

      const credit = await db.query.aiCredits.findFirst({
        where: eq(aiCredits.tenantId, tenant.id),
      });

      // Create if doesn't exist
      if (!credit) {
        [credit] = await db
          .insert(aiCredits)
          .values({
            tenantId: tenant.id,
            balance: "0",
          })
          .returning();
      }

      return {
        balance: Number(credit.balance),
        lifetimeSpent: Number(credit.lifetimeSpent),
        lifetimePurchased: Number(credit.lifetimePurchased),
        lastPurchaseAt: credit.lastPurchaseAt,
        lastUsageAt: credit.lastUsageAt,
      };
    }),

    /**
     * Get transaction history
     */
    getHistory: tenantProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
          type: z.enum(["purchase", "usage", "refund", "adjustment"]).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        const conditions = [eq(aiCreditTransactions.tenantId, tenant.id)];

        if (input.type) {
          conditions.push(eq(aiCreditTransactions.type, input.type));
        }

        const items = await db.query.aiCreditTransactions.findMany({
          where: and(...conditions),
          orderBy: [desc(aiCreditTransactions.createdAt)],
          limit: input.limit,
          offset: input.offset,
        });

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(aiCreditTransactions)
          .where(and(...conditions));

        return {
          items: items.map((item) => ({
            ...item,
            amount: Number(item.amount),
            balanceAfter: Number(item.balanceAfter),
          })),
          total: count,
          hasMore: input.offset + items.length < count,
        };
      }),

    /**
     * Deduct credits for AI usage
     * Internal use - called after AI message generation
     */
    deduct: tenantProcedure
      .input(
        z.object({
          amount: z.number().positive(),
          description: z.string(),
          metadata: z.object({
            conversationId: z.string().optional(),
            messageId: z.string().optional(),
            tokens: z.number().optional(),
            modelId: z.string().optional(),
          }).optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant, user } = context;

        // Get current balance
        const credit = await db.query.aiCredits.findFirst({
          where: eq(aiCredits.tenantId, tenant.id),
        });

        if (!credit) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Credit account not found",
          });
        }

        const currentBalance = Number(credit.balance);

        if (currentBalance < input.amount) {
          throw new ORPCError({
            code: "FORBIDDEN",
            message: "Insufficient credits",
          });
        }

        const newBalance = currentBalance - input.amount;

        // Update balance
        await db
          .update(aiCredits)
          .set({
            balance: newBalance.toString(),
            lifetimeSpent: sql`${aiCredits.lifetimeSpent} + ${input.amount}`,
            lastUsageAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(aiCredits.tenantId, tenant.id));

        // Record transaction
        const [transaction] = await db
          .insert(aiCreditTransactions)
          .values({
            tenantId: tenant.id,
            userId: user.id,
            type: "usage",
            amount: (-input.amount).toString(),
            balanceAfter: newBalance.toString(),
            description: input.description,
            metadata: input.metadata || {},
          })
          .returning();

        return {
          balance: newBalance,
          transaction: {
            ...transaction,
            amount: Number(transaction.amount),
            balanceAfter: Number(transaction.balanceAfter),
          },
        };
      }),
  }),

  // ============================================
  // PACKAGES
  // ============================================

  packages: or({
    /**
     * List available credit packages
     */
    list: protectedProcedure.handler(async ({ context }) => {
      const { db } = context;

      const packages = await db.query.aiCreditPackages.findMany({
        where: eq(aiCreditPackages.isActive, true),
        orderBy: [desc(aiCreditPackages.credits)],
      });

      return packages.map((pkg) => ({
        ...pkg,
        price: Number(pkg.price),
      }));
    }),

    /**
     * Get single package details
     */
    get: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const pkg = await db.query.aiCreditPackages.findFirst({
          where: and(
            eq(aiCreditPackages.id, input.id),
            eq(aiCreditPackages.isActive, true)
          ),
        });

        if (!pkg) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Package not found",
          });
        }

        return {
          ...pkg,
          price: Number(pkg.price),
        };
      }),
  }),

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  subscriptions: or({
    /**
     * Get current subscription
     */
    getCurrent: tenantProcedure.handler(async ({ context }) => {
      const { db, tenant } = context;

      const subscription = await db.query.stripeSubscriptions.findFirst({
        where: and(
          eq(stripeSubscriptions.tenantId, tenant.id),
          eq(stripeSubscriptions.status, "active")
        ),
      });

      if (!subscription) {
        return null;
      }

      return {
        ...subscription,
        monthlyCredits: subscription.monthlyCredits
          ? Number(subscription.monthlyCredits)
          : null,
      };
    }),

    /**
     * Get subscription history
     */
    getHistory: tenantProcedure.handler(async ({ context }) => {
      const { db, tenant } = context;

      const subscriptions = await db.query.stripeSubscriptions.findMany({
        where: eq(stripeSubscriptions.tenantId, tenant.id),
        orderBy: [desc(stripeSubscriptions.createdAt)],
      });

      return subscriptions.map((sub) => ({
        ...sub,
        monthlyCredits: sub.monthlyCredits ? Number(sub.monthlyCredits) : null,
      }));
    }),
  }),

  // ============================================
  // STRIPE
  // ============================================

  stripe: or({
    /**
     * Get or create Stripe customer
     */
    getCustomer: tenantProcedure.handler(async ({ context }) => {
      const { db, tenant } = context;

      const customer = await db.query.stripeCustomers.findFirst({
        where: eq(stripeCustomers.tenantId, tenant.id),
      });

      return customer;
    }),

    /**
     * Create Stripe checkout session for credit purchase
     */
    createCheckout: tenantProcedure
      .input(
        z.object({
          packageId: z.string().uuid(),
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, tenant } = context;

        // Get package
        const pkg = await db.query.aiCreditPackages.findFirst({
          where: and(
            eq(aiCreditPackages.id, input.packageId),
            eq(aiCreditPackages.isActive, true)
          ),
        });

        if (!pkg) {
          throw new ORPCError({
            code: "NOT_FOUND",
            message: "Package not found",
          });
        }

        // In a real implementation, you would:
        // 1. Get or create Stripe customer
        // 2. Create Stripe checkout session
        // 3. Return session URL
        //
        // For now, return placeholder data
        return {
          sessionId: "cs_test_placeholder",
          url: "https://checkout.stripe.com/placeholder",
          package: {
            ...pkg,
            price: Number(pkg.price),
          },
        };
      }),
  }),
};
