/**
 * Authentication helper functions for Next.js frontend.
 *
 * Wraps Better Auth client methods with Next.js integration.
 */
import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

// Get NEXT_PUBLIC_APP_URL from environment (required)
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
if (!appUrl) {
  throw new Error("NEXT_PUBLIC_APP_URL environment variable not set. Set it in .env.local (localhost) or .env (production).");
}

// Create auth client with credentials: "include" for cookie persistence
const authClient = createAuthClient({
  baseURL: appUrl,
  plugins: [
    jwtClient(),
  ],
  fetchOptions: {
    credentials: "include",
  },
});

// Export auth methods
export const signUp = authClient.signUp.email;
export const signIn = authClient.signIn.email;
export const signOut = authClient.signOut;
export const getSession = authClient.getSession;

/**
 * Get current session (helper function).
 */
export async function fetchSession() {
  try {
    const { data } = await authClient.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

/**
 * Get JWT token for API calls.
 */
export async function getToken() {
  try {
    const { data } = await authClient.token();
    return data?.token || null;
  } catch {
    return null;
  }
}
