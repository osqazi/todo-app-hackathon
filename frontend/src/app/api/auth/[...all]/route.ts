/**
 * Better Auth API route handler.
 * 
 * This catch-all route handles all Better Auth endpoints:
 * - POST /api/auth/sign-up - Create new account
 * - POST /api/auth/sign-in - Authenticate user
 * - POST /api/auth/sign-out - End session
 * - GET /api/auth/get-session - Get current session
 * - GET /api/auth/token - Get JWT access token
 * - GET /api/auth/jwks - Get public keys for JWT verification
 */
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
