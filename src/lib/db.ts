// src/lib/db.ts

import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import pg from 'pg';
import { dirname, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as schema from './db-schema';
import { getDbDriver, getPostgresConnectionString, getSqliteDatabasePath } from './db-runtime';

let sqlite: Database.Database | null = null;
let postgresPool: pg.Pool | null = null;

function createSqliteDb() {
  const dbPath = resolve(process.cwd(), getSqliteDatabasePath());
  const dbDir = dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  return drizzleSqlite(sqlite, { schema });
}

function createPostgresDb() {
  postgresPool = new pg.Pool({ connectionString: getPostgresConnectionString() });
  return drizzlePostgres(postgresPool, { schema });
}

export const db = (getDbDriver() === 'postgres' ? createPostgresDb() : createSqliteDb()) as ReturnType<typeof createSqliteDb>;

export async function closeDb() {
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
  }

  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
}
