import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { tenants } from "./tenants";

/**
 * AI Credit Packages
 * Predefined packages of AI credits for purchase
 */
export const aiCreditPackages = pgTable("ai_credit_packages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  credits: integer("credits").notNull(), // Number of credits in package
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Price in USD
  stripePriceId: varchar("stripe_price_id", { length: 255 }), // Stripe Price ID
  isActive: boolean("is_active").notNull().default(true),
  isPopular: boolean("is_popular").notNull().default(false), // Featured/popular badge
  metadata: jsonb("metadata").$type<{
    features?: string[];
    displayOrder?: number;
    bonusCredits?: number;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * AI Credits
 * User/Tenant credit balances
 */
export const aiCredits = pgTable(
  "ai_credits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"), // Current balance in USD
    lifetimeSpent: decimal("lifetime_spent", { precision: 10, scale: 2 }).notNull().default("0"),
    lifetimePurchased: decimal("lifetime_purchased", { precision: 10, scale: 2 }).notNull().default("0"),
    lastPurchaseAt: timestamp("last_purchase_at"),
    lastUsageAt: timestamp("last_usage_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("ai_credits_tenant_id_idx").on(table.tenantId),
  })
);

/**
 * AI Credit Transactions
 * History of credit purchases and usage
 */
export const aiCreditTransactions = pgTable(
  "ai_credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    type: varchar("type", { length: 50 }).notNull(), // "purchase", "usage", "refund", "adjustment"
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Positive for purchases, negative for usage
    balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<{
      packageId?: string;
      conversationId?: string;
      messageId?: string;
      stripePaymentIntentId?: string;
      stripeChargeId?: string;
      refundReason?: string;
      tokens?: number;
      modelId?: string;
    }>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("ai_credit_transactions_tenant_id_idx").on(table.tenantId),
    typeIdx: index("ai_credit_transactions_type_idx").on(table.type),
    createdAtIdx: index("ai_credit_transactions_created_at_idx").on(table.createdAt),
  })
);

/**
 * Stripe Customers
 * Link tenants to Stripe customer records
 */
export const stripeCustomers = pgTable(
  "stripe_customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" })
      .unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }),
    metadata: jsonb("metadata").$type<{
      name?: string;
      phone?: string;
      address?: any;
    }>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("stripe_customers_tenant_id_idx").on(table.tenantId),
    stripeCustomerIdIdx: index("stripe_customers_stripe_customer_id_idx").on(table.stripeCustomerId),
  })
);

/**
 * Stripe Subscriptions
 * Track active subscriptions with AI credit allowances
 */
export const stripeSubscriptions = pgTable(
  "stripe_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).notNull(), // "active", "canceled", "past_due", "unpaid"
    planName: varchar("plan_name", { length: 255 }),
    monthlyCredits: decimal("monthly_credits", { precision: 10, scale: 2 }), // Monthly credit allowance
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    metadata: jsonb("metadata").$type<{
      stripePriceId?: string;
      features?: string[];
    }>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tenantIdIdx: index("stripe_subscriptions_tenant_id_idx").on(table.tenantId),
    statusIdx: index("stripe_subscriptions_status_idx").on(table.status),
    stripeSubscriptionIdIdx: index("stripe_subscriptions_stripe_subscription_id_idx").on(table.stripeSubscriptionId),
  })
);

// Relations
export const aiCreditPackagesRelations = relations(aiCreditPackages, ({ many }) => ({
  transactions: many(aiCreditTransactions),
}));

export const aiCreditsRelations = relations(aiCredits, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [aiCredits.tenantId],
    references: [tenants.id],
  }),
  transactions: many(aiCreditTransactions),
}));

export const aiCreditTransactionsRelations = relations(aiCreditTransactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiCreditTransactions.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [aiCreditTransactions.userId],
    references: [users.id],
  }),
}));

export const stripeCustomersRelations = relations(stripeCustomers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [stripeCustomers.tenantId],
    references: [tenants.id],
  }),
  subscriptions: many(stripeSubscriptions),
}));

export const stripeSubscriptionsRelations = relations(stripeSubscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [stripeSubscriptions.tenantId],
    references: [tenants.id],
  }),
}));
