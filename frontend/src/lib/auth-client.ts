/**
 * Better Auth client for frontend authentication operations.
 *
 * Provides methods for:
 * - signUp: Create new user account
 * - signIn: Authenticate existing user
 * - signOut: End session
 * - getSession: Get current session data
 * - token(): Get JWT access token for API requests
 */
import { createAuthClient } from "better-auth/client";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [jwtClient()],
  fetchOptions: {
    credentials: "include",
  },
});

// Export auth methods for convenience
export const { signUp, signIn, signOut, getSession } = authClient;
