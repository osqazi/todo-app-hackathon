/**
 * Migration script for Better Auth tables using pg driver
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_tOJo42lSGmHK@ep-fragrant-recipe-a1i8t4gi-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  console.log('Creating Better Auth tables...');

  try {
    // Drop existing tables in correct order (due to foreign keys)
    console.log('Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS "session" CASCADE');
    await pool.query('DROP TABLE IF EXISTS "account" CASCADE');
    await pool.query('DROP TABLE IF EXISTS "verification" CASCADE');
    await pool.query('DROP TABLE IF EXISTS "user" CASCADE');

    // Create user table
    await pool.query(`
      CREATE TABLE "user" (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created user table');

    // Create session table
    await pool.query(`
      CREATE TABLE "session" (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created session table');

    // Create account table
    await pool.query(`
      CREATE TABLE "account" (
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
    console.log('Created account table');

    // Create verification table
    await pool.query(`
      CREATE TABLE "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created verification table');

    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session"(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account"(user_id)');
    console.log('Created indexes');

    console.log('\nMigration complete!');
  } finally {
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
