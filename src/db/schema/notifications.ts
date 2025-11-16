import { pgTable, text, timestamp, uuid, varchar, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { tenants } from "./tenants";

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Target
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id, { onDelete: "cascade" }),

  // Notification content
  type: varchar("type", { length: 50 }).notNull(), // invite, mention, update, alert, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),

  // Additional data (flexible JSON for type-specific data)
  data: jsonb("data").$type<{
    actionUrl?: string;
    actionText?: string;
    icon?: string;
    severity?: "info" | "warning" | "error" | "success";
    [key: string]: any;
  }>().default({}),

  // State
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration for time-sensitive notifications
});

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [notifications.tenantId],
    references: [tenants.id],
  }),
}));

// Notification preferences per user
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),

  // Channel preferences
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),

  // Type preferences
  preferences: jsonb("preferences").$type<{
    invites?: boolean;
    mentions?: boolean;
    updates?: boolean;
    marketing?: boolean;
    security?: boolean;
    billing?: boolean;
    [key: string]: boolean | undefined;
  }>().default({
    invites: true,
    mentions: true,
    updates: true,
    marketing: false,
    security: true,
    billing: true,
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertNotificationSchema = createInsertSchema(notifications, {
  type: z.enum([
    "invite",
    "mention",
    "update",
    "alert",
    "welcome",
    "billing",
    "security",
    "system",
  ]),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
});

export const selectNotificationSchema = createSelectSchema(notifications);

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences);
export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;
