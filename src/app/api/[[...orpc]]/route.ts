import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@/lib/orpc";
import { createContext } from "@/lib/orpc/context";

const handler = new RPCHandler({
  router: appRouter,
});

async function handleRequest(request: Request) {
  const context = await createContext(request);

  const result = await handler.handle({
    request,
    prefix: "/api",
    context,
  });

  return result.response;
}

export { handleRequest as GET, handleRequest as POST };
