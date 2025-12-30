/**
 * Better Auth configuration with JWT plugin and Neon PostgreSQL adapter.
 *
 * This file configures:
 * - Email/password authentication
 * - JWT token generation with EdDSA signing
 * - Session management with Neon PostgreSQL storage via Drizzle
 * - JWKS endpoint for public key distribution
 */
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

// Debug: Log environment variables
console.log("DEBUG auth.ts: NEXT_PUBLIC_APP_URL =", process.env.NEXT_PUBLIC_APP_URL);
console.log("DEBUG auth.ts: NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
    schema: schema,
  }),
  secret: process.env.BETTER_AUTH_SECRET || "dev-secret-key-change-in-production-min-32-chars",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Phase II: No email verification
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14, // 14 days (in seconds)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  plugins: [
    jwt(),
  ],
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  ],
  advanced: {
    cookiePrefix: "better-auth",
    generateId: () => {
      // Generate text IDs for PostgreSQL TEXT columns
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
  },
});
