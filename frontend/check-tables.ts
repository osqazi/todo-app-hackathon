import * as dotenv from 'dotenv';
const envConfig = dotenv.config({ path: '.env.local' });

// Manually set env vars before importing db
if (envConfig.parsed) {
  Object.assign(process.env, envConfig.parsed);
}

import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';

async function checkTables() {
  try {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('Existing tables:');
    result.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
