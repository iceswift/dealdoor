const Database = require('better-sqlite3');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const dbPath = process.argv[2] || path.join(process.cwd(), 'db', 'dev.db');
const migrationsDir = path.join(process.cwd(), 'drizzle', 'migrations');
const journalPath = path.join(migrationsDir, 'meta', '_journal.json');

const requiredTables = [
  'users',
  'sessions',
  'merchants',
  'shops',
  'deals',
  'menu_items',
  'shop_special_hours',
  'analytics_events',
  'daily_stats',
  'notifications',
  'reports',
];

function readLatestMigration() {
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const entry = journal.entries[journal.entries.length - 1];
  if (!entry) throw new Error('No migration entries found in drizzle journal.');

  const sqlPath = path.join(migrationsDir, `${entry.tag}.sql`);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  return {
    tag: entry.tag,
    when: entry.when,
    hash: crypto.createHash('sha256').update(sql).digest('hex'),
  };
}

function getTables(db) {
  return db
    .prepare('SELECT name, type FROM sqlite_master ORDER BY name')
    .all()
    .filter((row) => row.type === 'table')
    .map((row) => row.name);
}

const migration = readLatestMigration();
const db = new Database(dbPath);

try {
  const tableSet = new Set(getTables(db));
  const missing = requiredTables.filter((table) => !tableSet.has(table));
  if (missing.length > 0) {
    throw new Error(`Refusing to baseline. Missing app tables: ${missing.join(', ')}`);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  const existing = db
    .prepare('SELECT id, hash, created_at FROM "__drizzle_migrations" WHERE created_at = ? OR hash = ? LIMIT 1')
    .get(migration.when, migration.hash);

  if (existing) {
    console.log(`Migration baseline already recorded: ${migration.tag}`);
    process.exit(0);
  }

  db.prepare('INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)')
    .run(migration.hash, migration.when);

  console.log(`Recorded migration baseline: ${migration.tag}`);
} finally {
  db.close();
}

