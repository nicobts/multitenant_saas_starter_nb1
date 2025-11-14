"use client";

import { createORPCClient } from "@orpc/client";
import { createORPCReact } from "@orpc/react";
import type { AppRouter } from "./index";

export const orpcClient = createORPCClient<AppRouter>({
  baseURL: "/api",
});

export const orpc = createORPCReact<AppRouter>();
