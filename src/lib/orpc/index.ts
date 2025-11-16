import { or } from "@orpc/server";
import { projectsRouter } from "./routers/projects";
import { tenantsRouter } from "./routers/tenants";
import { notificationsRouter } from "./routers/notifications";
import { adminRouter } from "./routers/admin";
import { aiRouter } from "./routers/ai";
import { billingRouter } from "./routers/billing";
import { aiAnalyticsRouter } from "./routers/ai-analytics";

export const appRouter = or({
  projects: projectsRouter,
  tenants: tenantsRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  ai: aiRouter,
  billing: billingRouter,
  aiAnalytics: aiAnalyticsRouter,
});

export type AppRouter = typeof appRouter;
