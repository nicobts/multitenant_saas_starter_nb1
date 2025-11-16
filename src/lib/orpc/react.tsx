"use client";

import { createORPCReact, type ORPCClient } from "@orpc/react";
import { orpcClient } from "./client";
import type { AppRouter } from "./index";

export const orpc = createORPCReact<AppRouter>();

export const orpcClient: ORPCClient<AppRouter> = orpc.createClient({
  fetch: async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }
    return response;
  },
  baseURL: "/api",
});
