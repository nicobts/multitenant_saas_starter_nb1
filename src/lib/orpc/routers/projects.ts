import { or } from "@orpc/server";
import { z } from "zod";
import { tenantProcedure } from "../init";
import { eq, and } from "drizzle-orm";
import { projects, insertProjectSchema } from "@/db/schema";

export const projectsRouter = or({
  list: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const items = await db.query.projects.findMany({
        where: eq(projects.tenantId, tenant.id),
        limit: input.limit,
        offset: input.offset,
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      return items;
    }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.tenantId, tenant.id)
        ),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error("Project not found");
      }

      return project;
    }),

  create: tenantProcedure
    .input(
      insertProjectSchema.pick({
        name: true,
        description: true,
        slug: true,
      })
    )
    .handler(async ({ input, context }) => {
      const { db, tenant, user } = context;

      const [project] = await db
        .insert(projects)
        .values({
          ...input,
          tenantId: tenant.id,
          ownerId: user.id,
        })
        .returning();

      return project;
    }),

  update: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: insertProjectSchema
          .pick({
            name: true,
            description: true,
            slug: true,
            isActive: true,
          })
          .partial(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const [updated] = await db
        .update(projects)
        .set({
          ...input.data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.tenantId, tenant.id)
          )
        )
        .returning();

      if (!updated) {
        throw new Error("Project not found");
      }

      return updated;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, tenant } = context;

      const [deleted] = await db
        .delete(projects)
        .where(
          and(
            eq(projects.id, input.id),
            eq(projects.tenantId, tenant.id)
          )
        )
        .returning();

      if (!deleted) {
        throw new Error("Project not found");
      }

      return { success: true };
    }),
});
