/**
 * Clear JWKS table to fix "Failed to decrypt private key" error.
 * Run with: npx tsx scripts/clear-jwks.ts
 */

import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in environment variables");
  process.exit(1);
}

async function clearJWKS() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log("Connecting to database...");

    // Delete all JWKS entries
    const result = await pool.query("DELETE FROM jwks");

    console.log(`✅ Successfully cleared JWKS table (${result.rowCount} rows deleted)`);
    console.log("Better Auth will regenerate the keys on next startup.");

  } catch (error) {
    console.error("❌ Error clearing JWKS:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

clearJWKS();
