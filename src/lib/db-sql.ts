import { sql } from 'drizzle-orm';
import { isPostgresRuntime } from './db-runtime';

type SqlColumn = any;

export function dayBucket(column: SqlColumn) {
  if (isPostgresRuntime()) {
    return sql<string>`to_char(${column}, 'YYYY-MM-DD')`;
  }

  return sql<string>`date(${column}, 'unixepoch')`;
}

export function isToday(column: SqlColumn) {
  if (isPostgresRuntime()) {
    return sql`date(${column}) = current_date`;
  }

  return sql`date(${column}) = date('now')`;
}

export function jsonTextEquals(column: SqlColumn, key: string, value: string) {
  if (isPostgresRuntime()) {
    return sql`(${column})::jsonb ->> ${key} = ${value}`;
  }

  return sql`json_extract(${column}, ${`$.${key}`}) = ${value}`;
}
