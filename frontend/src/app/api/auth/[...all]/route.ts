/**
 * Better Auth API route handler.
 *
 * Proxies all Better Auth endpoints to backend FastAPI.
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
