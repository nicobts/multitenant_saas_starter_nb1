import { pgTable, text, timestamp, uuid, varchar, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // Used for subdomain routing
  domain: varchar("domain", { length: 255 }), // Custom domain (optional)

  // Subscription & Billing
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  stripeSubscriptionStatus: varchar("stripe_subscription_status", { length: 50 }),

  // Plan & Limits
  plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, starter, pro, enterprise
  maxUsers: integer("max_users").default(5),
  maxProjects: integer("max_projects").default(3),

  // Settings
  settings: jsonb("settings").$type<{
    language?: string;
    timezone?: string;
    features?: string[];
  }>().default({}),

  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertTenantSchema = createInsertSchema(tenants, {
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  domain: z.string().optional(),
  plan: z.enum(["free", "starter", "pro", "enterprise"]),
});

export const selectTenantSchema = createSelectSchema(tenants);

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
