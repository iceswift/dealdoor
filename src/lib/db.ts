// src/lib/db.ts

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../../db/schema';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure db directory exists
const dbDir = resolve(process.cwd(), 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const dbPath = resolve(dbDir, 'dev.db');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
