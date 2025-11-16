import { or } from "@orpc/server";
import { projectsRouter } from "./routers/projects";
import { tenantsRouter } from "./routers/tenants";
import { notificationsRouter } from "./routers/notifications";
import { adminRouter } from "./routers/admin";

export const appRouter = or({
  projects: projectsRouter,
  tenants: tenantsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
