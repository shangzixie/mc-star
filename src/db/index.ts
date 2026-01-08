/**
 * Connect to PostgreSQL Database (Supabase/Neon/Local PostgreSQL)
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DbState = {
  db: ReturnType<typeof drizzle> | null;
  client: ReturnType<typeof postgres> | null;
};

const globalForDb = globalThis as unknown as {
  __freightDbState?: DbState;
};

function getState(): DbState {
  if (!globalForDb.__freightDbState) {
    globalForDb.__freightDbState = { db: null, client: null };
  }
  return globalForDb.__freightDbState;
}

function isConnectionClosedError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('CONNECTION_CLOSED') || msg.includes('connection closed');
}

export async function getDb() {
  const state = getState();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  // Reuse singleton across Next.js dev HMR to avoid creating many connections.
  if (state.db && state.client) {
    // Poolers (e.g. Supabase pgbouncer) may drop idle connections; do a cheap ping.
    try {
      await state.client`select 1`;
      return state.db;
    } catch (error) {
      if (!isConnectionClosedError(error)) throw error;
      try {
        await state.client.end({ timeout: 1 });
      } catch {
        // ignore
      }
      state.client = null;
      state.db = null;
    }
  }

  // postgres-js options tuned for hosted poolers:
  // - prepare:false required for pgbouncer transaction pooling
  // - max: keep pool small for serverless/dev
  // - idle_timeout: avoid holding idle connections too long
  const client = postgres(connectionString, {
    prepare: false,
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    keep_alive: 60,
  });

  state.client = client;
  state.db = drizzle(client, { schema });
  return state.db;
}

/**
 * Connect to Neon Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 */
// import { drizzle } from 'drizzle-orm/neon-http';
// const db = drizzle(process.env.DATABASE_URL!);

/**
 * Database connection with Drizzle
 * https://orm.drizzle.team/docs/connect-overview
 *
 * Drizzle <> PostgreSQL
 * https://orm.drizzle.team/docs/get-started-postgresql
 *
 * Get Started with Drizzle and Neon
 * https://orm.drizzle.team/docs/get-started/neon-new
 *
 * Drizzle with Neon Postgres
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-neon
 *
 * Drizzle <> Neon Postgres
 * https://orm.drizzle.team/docs/connect-neon
 *
 * Drizzle with Supabase Database
 * https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase
 */
