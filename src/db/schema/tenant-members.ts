import { pgTable, uuid, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { tenants } from "./tenants";

export const tenantMembers = pgTable(
  "tenant_members",
  {
    id: uuid("id").defaultRandom().notNull(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default("member"), // owner, admin, member

    invitedBy: uuid("invited_by").references(() => users.id),
    invitedAt: timestamp("invited_at").defaultNow(),
    joinedAt: timestamp("joined_at").defaultNow(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenantId, table.userId] }),
  })
);

// Relations
export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [tenantMembers.invitedBy],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertTenantMemberSchema = createInsertSchema(tenantMembers, {
  role: z.enum(["owner", "admin", "member"]),
});

export const selectTenantMemberSchema = createSelectSchema(tenantMembers);

export type TenantMember = typeof tenantMembers.$inferSelect;
export type InsertTenantMember = typeof tenantMembers.$inferInsert;
