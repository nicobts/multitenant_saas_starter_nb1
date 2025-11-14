import { or } from "@orpc/server";
import { projectsRouter } from "./routers/projects";
import { tenantsRouter } from "./routers/tenants";

export const appRouter = or({
  projects: projectsRouter,
  tenants: tenantsRouter,
});

export type AppRouter = typeof appRouter;
