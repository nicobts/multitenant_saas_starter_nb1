import { or, ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../init";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import {
  adminRoles,
  featureFlags,
  impersonationLogs,
  platformMetrics,
  tenants,
  users,
  tenantMembers,
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

export const adminRouter = {
  // ===== TENANT MANAGEMENT =====

  // List all tenants with stats
  listTenants: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      // Get tenants with member count
      const tenantsData = await db
        .select({
          tenant: tenants,
          memberCount: sql<number>`count(${tenantMembers.id})::int`,
        })
        .from(tenants)
        .leftJoin(tenantMembers, eq(tenants.id, tenantMembers.tenantId))
        .groupBy(tenants.id)
        .orderBy(desc(tenants.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return {
        items: tenantsData,
        hasMore: tenantsData.length === input.limit,
      };
    }),

  // Get tenant details with full stats
  getTenant: superAdminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, input.id),
      });

      if (!tenant) {
        throw new Error("Tenant not found");
      }

      // Get members
      const members = await db.query.tenantMembers.findMany({
        where: eq(tenantMembers.tenantId, input.id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      });

      // Get feature flags
      const flags = await db.query.featureFlags.findMany({
        where: eq(featureFlags.tenantId, input.id),
      });

      return {
        tenant,
        members,
        featureFlags: flags,
        stats: {
          memberCount: members.length,
          activeMembers: members.filter((m) => m.joinedAt).length,
        },
      };
    }),

  // Update tenant
  updateTenant: superAdminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: z.object({
          name: z.string().optional(),
          plan: z.enum(["free", "starter", "pro", "enterprise"]).optional(),
          maxUsers: z.number().optional(),
          maxProjects: z.number().optional(),
          isActive: z.boolean().optional(),
          settings: z.record(z.any()).optional(),
        }),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [updated] = await db
        .update(tenants)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, input.id))
        .returning();

      if (!updated) {
        throw new Error("Tenant not found");
      }

      return updated;
    }),

  // ===== FEATURE FLAGS =====

  // Set feature flag for tenant
  setFeatureFlag: superAdminProcedure
    .input(
      z.object({
        tenantId: z.string().uuid().optional(), // null for global flags
        key: z.string(),
        enabled: z.boolean(),
        config: z.record(z.any()).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      // Check if flag exists
      const existing = await db.query.featureFlags.findFirst({
        where: and(
          input.tenantId ? eq(featureFlags.tenantId, input.tenantId) : sql`${featureFlags.tenantId} IS NULL`,
          eq(featureFlags.key, input.key)
        ),
      });

      if (existing) {
        // Update
        const [updated] = await db
          .update(featureFlags)
          .set({
            enabled: input.enabled,
            config: input.config || existing.config,
            updatedAt: new Date(),
          })
          .where(eq(featureFlags.id, existing.id))
          .returning();

        return updated;
      } else {
        // Create
        const [created] = await db
          .insert(featureFlags)
          .values({
            tenantId: input.tenantId || null,
            key: input.key,
            enabled: input.enabled,
            config: input.config || {},
          })
          .returning();

        return created;
      }
    }),

  // Get all feature flags
  getFeatureFlags: superAdminProcedure
    .input(
      z.object({
        tenantId: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const flags = await db.query.featureFlags.findMany({
        where: input.tenantId ? eq(featureFlags.tenantId, input.tenantId) : sql`${featureFlags.tenantId} IS NULL`,
      });

      return flags;
    }),

  // ===== IMPERSONATION =====

  // Start impersonating a user
  startImpersonation: superAdminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        reason: z.string().min(10),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      // Get target user
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!targetUser) {
        throw new Error("User not found");
      }

      // Create impersonation log
      const [log] = await db
        .insert(impersonationLogs)
        .values({
          adminId: user.id,
          targetUserId: input.userId,
          reason: input.reason,
          // IP and user agent would come from request headers
        })
        .returning();

      return {
        log,
        targetUser,
      };
    }),

  // End impersonation
  endImpersonation: superAdminProcedure
    .input(z.object({ logId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [updated] = await db
        .update(impersonationLogs)
        .set({
          endedAt: new Date(),
        })
        .where(eq(impersonationLogs.id, input.logId))
        .returning();

      if (!updated) {
        throw new Error("Impersonation log not found");
      }

      return updated;
    }),

  // Get impersonation history
  getImpersonationLogs: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const logs = await db.query.impersonationLogs.findMany({
        orderBy: [desc(impersonationLogs.startedAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          admin: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          targetUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return logs;
    }),

  // ===== ANALYTICS & METRICS =====

  // Get platform overview stats
  getOverviewStats: superAdminProcedure.handler(async ({ context }) => {
    const { db } = context;

    // Total tenants
    const [{ totalTenants }] = await db
      .select({ totalTenants: sql<number>`count(*)::int` })
      .from(tenants);

    // Active tenants (with at least one member)
    const [{ activeTenants }] = await db
      .select({ activeTenants: sql<number>`count(distinct ${tenantMembers.tenantId})::int` })
      .from(tenantMembers);

    // Total users
    const [{ totalUsers }] = await db
      .select({ totalUsers: sql<number>`count(*)::int` })
      .from(users);

    // Tenants by plan
    const tenantsByPlan = await db
      .select({
        plan: tenants.plan,
        count: sql<number>`count(*)::int`,
      })
      .from(tenants)
      .groupBy(tenants.plan);

    // New tenants this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [{ newTenantsThisMonth }] = await db
      .select({ newTenantsThisMonth: sql<number>`count(*)::int` })
      .from(tenants)
      .where(gte(tenants.createdAt, startOfMonth));

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      newTenantsThisMonth,
      tenantsByPlan: tenantsByPlan.reduce(
        (acc, { plan, count }) => {
          acc[plan] = count;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }),

  // Get platform metrics (time series)
  getMetrics: superAdminProcedure
    .input(
      z.object({
        metricType: z.enum(["signups", "revenue", "active_users"]),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      const metrics = await db.query.platformMetrics.findMany({
        where: and(
          eq(platformMetrics.metricType, input.metricType),
          gte(platformMetrics.date, new Date(input.startDate)),
          lte(platformMetrics.date, new Date(input.endDate))
        ),
        orderBy: [desc(platformMetrics.date)],
      });

      return metrics;
    }),

  // ===== ADMIN ROLE MANAGEMENT =====

  // Grant admin role
  grantAdminRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "super_admin"]),
        permissions: z.array(z.string()).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if already has admin role
      const existing = await db.query.adminRoles.findFirst({
        where: eq(adminRoles.userId, input.userId),
      });

      if (existing) {
        // Update
        const [updated] = await db
          .update(adminRoles)
          .set({
            role: input.role,
            permissions: input.permissions || existing.permissions,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(adminRoles.userId, input.userId))
          .returning();

        return updated;
      } else {
        // Create
        const [created] = await db
          .insert(adminRoles)
          .values({
            userId: input.userId,
            role: input.role,
            permissions: input.permissions || [],
          })
          .returning();

        return created;
      }
    }),

  // Revoke admin role
  revokeAdminRole: superAdminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .handler(async ({ context, input }) => {
      const { db } = context;

      const [updated] = await db
        .update(adminRoles)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(adminRoles.userId, input.userId))
        .returning();

      if (!updated) {
        throw new Error("Admin role not found");
      }

      return updated;
    }),

  // List all admins
  listAdmins: superAdminProcedure.handler(async ({ context }) => {
    const { db } = context;

    const admins = await db.query.adminRoles.findMany({
      where: eq(adminRoles.isActive, true),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return admins;
  }),
};
