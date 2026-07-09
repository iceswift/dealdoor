import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './db-schema.postgres';
import { getPostgresConnectionString } from './db-runtime';

const pool = new pg.Pool({ connectionString: getPostgresConnectionString() });

export const db = drizzle(pool, { schema });

export async function closePostgresDb() {
  await pool.end();
}
