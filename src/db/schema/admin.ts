import { pgTable, text, timestamp, uuid, varchar, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { tenants } from "./tenants";

// Super admin roles
export const adminRoles = pgTable("admin_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),

  role: varchar("role", { length: 50 }).notNull().default("admin"), // admin, super_admin
  permissions: jsonb("permissions").$type<string[]>().default([]), // Array of permission strings

  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const adminRolesRelations = relations(adminRoles, ({ one }) => ({
  user: one(users, {
    fields: [adminRoles.userId],
    references: [users.id],
  }),
}));

// Feature flags for tenants
export const featureFlags = pgTable("feature_flags", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Flag details
  key: varchar("key", { length: 100 }).notNull(), // feature_analytics, feature_api_access, etc.
  enabled: boolean("enabled").notNull().default(false),

  // Configuration
  config: jsonb("config").$type<{
    limit?: number;
    options?: string[];
    [key: string]: any;
  }>().default({}),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  tenant: one(tenants, {
    fields: [featureFlags.tenantId],
    references: [tenants.id],
  }),
}));

// Impersonation logs (audit trail)
export const impersonationLogs = pgTable("impersonation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  targetUserId: uuid("target_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),

  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Relations
export const impersonationLogsRelations = relations(impersonationLogs, ({ one }) => ({
  admin: one(users, {
    fields: [impersonationLogs.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [impersonationLogs.targetUserId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [impersonationLogs.tenantId],
    references: [tenants.id],
  }),
}));

// Platform metrics (for super admin dashboard)
export const platformMetrics = pgTable("platform_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),

  date: timestamp("date").notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // daily_active_users, revenue, signups, etc.

  value: integer("value").notNull(),
  metadata: jsonb("metadata").$type<{
    breakdown?: Record<string, number>;
    [key: string]: any;
  }>().default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertAdminRoleSchema = createInsertSchema(adminRoles, {
  role: z.enum(["admin", "super_admin"]),
  permissions: z.array(z.string()),
});

export const selectAdminRoleSchema = createSelectSchema(adminRoles);

export const insertFeatureFlagSchema = createInsertSchema(featureFlags, {
  key: z.string().min(1).max(100),
  enabled: z.boolean(),
});

export const selectFeatureFlagSchema = createSelectSchema(featureFlags);

export const insertImpersonationLogSchema = createInsertSchema(impersonationLogs);
export const selectImpersonationLogSchema = createSelectSchema(impersonationLogs);

export const insertPlatformMetricSchema = createInsertSchema(platformMetrics);
export const selectPlatformMetricSchema = createSelectSchema(platformMetrics);

export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminRole = typeof adminRoles.$inferInsert;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;
export type ImpersonationLog = typeof impersonationLogs.$inferSelect;
export type InsertImpersonationLog = typeof impersonationLogs.$inferInsert;
export type PlatformMetric = typeof platformMetrics.$inferSelect;
export type InsertPlatformMetric = typeof platformMetrics.$inferInsert;
