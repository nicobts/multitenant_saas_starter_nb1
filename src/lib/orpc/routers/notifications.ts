import { z } from "zod";
import { protectedProcedure } from "../init";
import { eq, and, desc, sql } from "drizzle-orm";
import { notifications, notificationPreferences, insertNotificationSchema } from "@/db/schema";

export const notificationsRouter = {
  // Get user's notifications
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        unreadOnly: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const conditions = [eq(notifications.userId, user.id)];

      if (input.unreadOnly) {
        conditions.push(eq(notifications.read, false));
      }

      const items = await db.query.notifications.findMany({
        where: and(...conditions),
        orderBy: [desc(notifications.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      // Get unread count
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

      return {
        items,
        unreadCount: count,
        hasMore: items.length === input.limit,
      };
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const [updated] = await db
        .update(notifications)
        .set({
          read: true,
          readAt: new Date(),
        })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, user.id)))
        .returning();

      if (!updated) {
        throw new Error("Notification not found");
      }

      return updated;
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.handler(async ({ context }) => {
    const { db, user } = context;

    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

    return { success: true };
  }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const [deleted] = await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, user.id)))
        .returning();

      if (!deleted) {
        throw new Error("Notification not found");
      }

      return { success: true };
    }),

  // Get notification preferences
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    const { db, user } = context;

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id),
    });

    // Create default preferences if not exists
    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: user.id,
        })
        .returning();
    }

    return prefs;
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(
      z.object({
        emailEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
        preferences: z
          .object({
            invites: z.boolean().optional(),
            mentions: z.boolean().optional(),
            updates: z.boolean().optional(),
            marketing: z.boolean().optional(),
            security: z.boolean().optional(),
            billing: z.boolean().optional(),
          })
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      // Get or create preferences
      let prefs = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, user.id),
      });

      if (!prefs) {
        [prefs] = await db
          .insert(notificationPreferences)
          .values({
            userId: user.id,
            ...input,
          })
          .returning();
      } else {
        [prefs] = await db
          .update(notificationPreferences)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.userId, user.id))
          .returning();
      }

      return prefs;
    }),

  // Create notification (internal use - for testing or system notifications)
  create: protectedProcedure
    .input(
      insertNotificationSchema.pick({
        type: true,
        title: true,
        message: true,
        data: true,
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const [notification] = await db
        .insert(notifications)
        .values({
          userId: user.id,
          tenantId: context.tenant?.id,
          ...input,
        })
        .returning();

      return notification;
    }),
};
