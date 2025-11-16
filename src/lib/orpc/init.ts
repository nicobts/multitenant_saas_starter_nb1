import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";

/**
 * Base procedure - available to all requests
 */
export const publicProcedure = os.context<Context>();

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({ context: { user: context.user } });
});

/**
 * Tenant procedure - requires both authentication and tenant context
 */
export const tenantProcedure = protectedProcedure.use(({ context, next }) => {
  if (!context.tenant) {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "Tenant context is required",
    });
  }

  return next({ context: { tenant: context.tenant } });
});

/**
 * Admin procedure - requires tenant admin or owner role
 */
export const adminProcedure = tenantProcedure.use(async ({ context, next }) => {
  const { user, tenant, db } = context;

  // Check if user is admin or owner
  const membership = await db.query.tenantMembers.findFirst({
    where: (members, { and, eq }) =>
      and(eq(members.tenantId, tenant.id), eq(members.userId, user.id)),
  });

  if (!membership || !["admin", "owner"].includes(membership.role)) {
    throw new ORPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({ context: { membership } });
});
