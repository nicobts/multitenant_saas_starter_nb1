import { z } from "zod";
import { protectedProcedure, adminProcedure } from "../init";
import { eq, and } from "drizzle-orm";
import { tenants, tenantMembers } from "@/db/schema";

export const tenantsRouter = {
  // List all tenants the user has access to
  list: protectedProcedure.handler(async ({ context }) => {
    const { db, user } = context;

    const memberships = await db.query.tenantMembers.findMany({
      where: eq(tenantMembers.userId, user.id),
      with: {
        tenant: true,
      },
    });

    return memberships.map((m) => ({
      ...m.tenant,
      role: m.role,
    }));
  }),

  // Get current tenant details
  getCurrent: protectedProcedure.handler(async ({ context }) => {
    const { tenant } = context;
    return tenant;
  }),

  // Update tenant settings (admin only)
  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const [updated] = await db
        .update(tenants)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id))
        .returning();

      return updated;
    }),

  // Get tenant members
  getMembers: adminProcedure.handler(async ({ context }) => {
    const { db, tenant } = context;

    const members = await db.query.tenantMembers.findMany({
      where: eq(tenantMembers.tenantId, tenant.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return members;
  }),

  // Update member role
  updateMemberRole: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["owner", "admin", "member"]),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const [updated] = await db
        .update(tenantMembers)
        .set({
          role: input.role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tenantMembers.tenantId, tenant.id),
            eq(tenantMembers.userId, input.userId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Member not found");
      }

      return updated;
    }),

  // Remove member
  removeMember: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, tenant, user } = context;

      // Prevent removing yourself
      if (input.userId === user.id) {
        throw new Error("Cannot remove yourself");
      }

      await db
        .delete(tenantMembers)
        .where(
          and(
            eq(tenantMembers.tenantId, tenant.id),
            eq(tenantMembers.userId, input.userId)
          )
        );

      return { success: true };
    }),
};
