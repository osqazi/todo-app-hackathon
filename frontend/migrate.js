/**
 * Drizzle migration script for Better Auth tables (JavaScript version).
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";

// Load environment variables from .env.local
const envFile = readFileSync(".env.local", "utf-8");
const envLines = envFile.split("\n");
for (const line of envLines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrate() {
  console.log("Creating Better Auth tables...");

  // Create users table (note: table name is 'user' not 'users')
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created 'user' table");

  // Create sessions table (note: table name is 'session' not 'sessions')
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created 'session' table");

  // Create accounts table (note: table name is 'account' not 'accounts')
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at TIMESTAMP WITH TIME ZONE,
      refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
      password TEXT,
      scope TEXT,
      id_token TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created 'account' table");

  // Create verification table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created 'verification' table");

  // Create jwks table (for JWT plugin)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS jwks (
      id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Created 'jwks' table");

  // Create indexes
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id)`);
  console.log("Created indexes");

  console.log("\n✅ Frontend migration complete!");
}

migrate()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });
