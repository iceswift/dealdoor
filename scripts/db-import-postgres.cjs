const { readFileSync } = require('node:fs');
const path = require('node:path');
const pg = require('pg');
const { columnsByTable, quoteIdent, tableOrder } = require('./db-migration-shared.cjs');

const inputPath = process.argv.find((arg) => !arg.startsWith('--') && arg.endsWith('.json'))
  || path.join(process.cwd(), 'tmp', 'dealdoor-sqlite-export.json');
const truncate = process.argv.includes('--truncate');
const connectionString = process.env.DATABASE_URL || 'postgres://dealdoor:dealdoor@localhost:54329/dealdoor';

function placeholders(count) {
  return Array.from({ length: count }, (_value, index) => `$${index + 1}`).join(', ');
}

function cloneData(data) {
  return Object.fromEntries(tableOrder.map((tableName) => [tableName, [...(data[tableName] || [])]]));
}

function idSet(rows) {
  return new Set(rows.map((row) => row.id).filter(Boolean));
}

function filterRequiredFk(rows, fkColumn, allowedIds, label, warnings) {
  const kept = rows.filter((row) => allowedIds.has(row[fkColumn]));
  const skipped = rows.length - kept.length;
  if (skipped > 0) warnings.push(`${label}: skipped ${skipped} rows with missing ${fkColumn}`);
  return kept;
}

function nullOptionalFk(rows, fkColumn, allowedIds, label, warnings) {
  let nulled = 0;
  const next = rows.map((row) => {
    if (row[fkColumn] && !allowedIds.has(row[fkColumn])) {
      nulled += 1;
      return { ...row, [fkColumn]: null };
    }

    return row;
  });

  if (nulled > 0) warnings.push(`${label}: set ${fkColumn} to null on ${nulled} rows`);
  return next;
}

function prepareDataForPostgres(data) {
  const prepared = cloneData(data);
  const warnings = [];

  const userIds = idSet(prepared.users);

  prepared.sessions = filterRequiredFk(prepared.sessions, 'user_id', userIds, 'sessions', warnings);
  prepared.merchants = nullOptionalFk(prepared.merchants, 'user_id', userIds, 'merchants', warnings);

  const merchantIds = idSet(prepared.merchants);
  prepared.shops = filterRequiredFk(prepared.shops, 'merchant_id', merchantIds, 'shops', warnings);

  const shopIds = idSet(prepared.shops);
  prepared.deals = filterRequiredFk(prepared.deals, 'shop_id', shopIds, 'deals', warnings);
  prepared.menu_items = filterRequiredFk(prepared.menu_items, 'shop_id', shopIds, 'menu_items', warnings);
  prepared.shop_special_hours = filterRequiredFk(prepared.shop_special_hours, 'shop_id', shopIds, 'shop_special_hours', warnings);
  prepared.daily_stats = filterRequiredFk(prepared.daily_stats, 'shop_id', shopIds, 'daily_stats', warnings);
  prepared.notifications = nullOptionalFk(prepared.notifications, 'shop_id', shopIds, 'notifications', warnings);

  const dealIds = idSet(prepared.deals);
  prepared.analytics_events = filterRequiredFk(prepared.analytics_events, 'shop_id', shopIds, 'analytics_events', warnings);
  prepared.analytics_events = nullOptionalFk(prepared.analytics_events, 'deal_id', dealIds, 'analytics_events', warnings);
  prepared.notifications = nullOptionalFk(prepared.notifications, 'user_id', userIds, 'notifications', warnings);
  prepared.reports = nullOptionalFk(prepared.reports, 'reporter_id', userIds, 'reports', warnings);
  prepared.reports = nullOptionalFk(prepared.reports, 'reviewed_by', userIds, 'reports', warnings);

  return { data: prepared, warnings };
}

async function assertTargetIsEmpty(client) {
  const occupiedTables = [];

  for (const tableName of tableOrder) {
    const result = await client.query(`select count(*)::int as count from ${quoteIdent(tableName)}`);
    if (result.rows[0].count > 0) {
      occupiedTables.push(`${tableName}=${result.rows[0].count}`);
    }
  }

  if (occupiedTables.length > 0) {
    throw new Error(
      `Postgres target is not empty (${occupiedTables.join(', ')}). Re-run with --truncate only for disposable/staging databases.`,
    );
  }
}

async function main() {
  const payload = JSON.parse(readFileSync(inputPath, 'utf8'));
  if (payload.version !== 1 || payload.source !== 'sqlite') {
    throw new Error(`Unsupported export payload: ${inputPath}`);
  }
  const prepared = prepareDataForPostgres(payload.data);

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    await client.query('begin');

    if (truncate) {
      const tablesSql = [...tableOrder].reverse().map(quoteIdent).join(', ');
      await client.query(`truncate table ${tablesSql} restart identity cascade`);
    } else {
      await assertTargetIsEmpty(client);
    }

    const importedCounts = {};

    for (const tableName of tableOrder) {
      const columns = columnsByTable[tableName];
      const rows = prepared.data[tableName] || [];
      importedCounts[tableName] = rows.length;

      if (rows.length === 0) continue;

      const sql = `insert into ${quoteIdent(tableName)} (${columns.map(quoteIdent).join(', ')}) values (${placeholders(columns.length)})`;

      for (const row of rows) {
        await client.query(sql, columns.map((column) => row[column] ?? null));
      }
    }

    await client.query('commit');

    console.log(`Postgres import completed: ${inputPath}`);
    for (const warning of prepared.warnings) {
      console.log(`Warning: ${warning}`);
    }
    for (const tableName of tableOrder) {
      console.log(`${tableName}: ${importedCounts[tableName]}`);
    }
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Postgres import failed.');
  console.error(error && error.message ? error.message : error);
  process.exit(1);
});
