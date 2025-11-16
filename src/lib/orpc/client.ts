"use client";

import { createORPCClient } from "@orpc/client";
import { createRouterUtils } from "@orpc/react-query";
import type { AppRouter } from "./index";

export const client = createORPCClient<AppRouter>({
  baseURL: "/api",
});

export const orpcClient = createRouterUtils(client);
