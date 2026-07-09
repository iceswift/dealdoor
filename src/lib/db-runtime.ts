export type DbDriver = 'sqlite' | 'postgres';

export function getDbDriver(): DbDriver {
  return process.env.DB_DRIVER === 'postgres' ? 'postgres' : 'sqlite';
}

export function isPostgresRuntime() {
  return getDbDriver() === 'postgres';
}

export function getPostgresConnectionString() {
  return process.env.DATABASE_URL || 'postgres://dealdoor:dealdoor@localhost:54329/dealdoor';
}

export function getSqliteDatabasePath() {
  return process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres://')
    ? process.env.DATABASE_URL
    : 'db/dev.db';
}
