/**
 * Better Auth API route handler.
 *
 * This file runs Better Auth server locally on Vercel/Next.js.
 * No backend API calls needed - Better Auth handles everything locally.
 */
import { auth } from "@/lib/auth";

/**
 * Better Auth handler for Next.js App Router
 * Handles all auth routes: sign-up, sign-in, sign-out, get-session, token, jwks
 */
export const { GET, POST } = toNextJsHandler(auth);

export const dynamic = "force-dynamic";
