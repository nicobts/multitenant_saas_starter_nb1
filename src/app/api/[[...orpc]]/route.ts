import { createORPCHandler } from "@orpc/next";
import { appRouter } from "@/lib/orpc";
import { createContext } from "@/lib/orpc/context";

const handler = createORPCHandler({
  router: appRouter,
  createContext,
});

export { handler as GET, handler as POST };
