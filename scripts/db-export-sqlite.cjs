const Database = require('better-sqlite3');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const { columnsByTable, normalizeSqliteRow, quoteIdent, tableOrder } = require('./db-migration-shared.cjs');

const sqlitePath = process.argv[2] || path.join(process.cwd(), 'db', 'dev.db');
const outputPath = process.argv[3] || path.join(process.cwd(), 'tmp', 'dealdoor-sqlite-export.json');

const outputDir = path.dirname(outputPath);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

const db = new Database(sqlitePath, { readonly: true });
const data = {};
const counts = {};

try {
  for (const tableName of tableOrder) {
    const columns = columnsByTable[tableName];
    const columnSql = columns.map(quoteIdent).join(', ');
    const rows = db.prepare(`select ${columnSql} from ${quoteIdent(tableName)}`).all();
    data[tableName] = rows.map((row) => normalizeSqliteRow(tableName, row));
    counts[tableName] = rows.length;
  }
} finally {
  db.close();
}

const payload = {
  version: 1,
  source: 'sqlite',
  exportedAt: new Date().toISOString(),
  sqlitePath,
  tableOrder,
  counts,
  data,
};

writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`SQLite export written: ${outputPath}`);
for (const tableName of tableOrder) {
  console.log(`${tableName}: ${counts[tableName]}`);
}
