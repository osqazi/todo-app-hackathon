/**
 * Database connection for Drizzle ORM with Neon PostgreSQL.
 *
 * Uses WebSocket connections compatible with serverless/Vercel environments.
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create Neon connection pool with WebSocket support
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon requires WebSocket connections
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000,
  max: 10,
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });
