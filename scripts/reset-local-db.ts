import 'dotenv/config';
import postgres from 'postgres';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = postgres(connectionString, { prepare: false });
  try {
    // Hard reset for local/dev: drops all tables, views, types, extensions in public schema.
    // This does NOT drop the database itself (safer for managed DBs / limited privileges).
    await sql`DROP SCHEMA IF EXISTS public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
