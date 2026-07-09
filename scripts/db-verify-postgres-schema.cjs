const { execFileSync } = require('node:child_process');

const containerName = process.env.POSTGRES_CONTAINER || 'dealdoor-postgres-local';
const dbName = process.env.POSTGRES_DB || 'dealdoor';
const dbUser = process.env.POSTGRES_USER || 'dealdoor';

const expectedTables = [
  'analytics_events',
  'daily_stats',
  'deals',
  'menu_items',
  'merchants',
  'notifications',
  'reports',
  'sessions',
  'shop_special_hours',
  'shops',
  'users',
];

function runPsql(sql) {
  return execFileSync(
    'docker',
    ['exec', containerName, 'psql', '-U', dbUser, '-d', dbName, '-Atc', sql],
    { encoding: 'utf8' },
  ).trim();
}

try {
  const rows = runPsql(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name;
  `);

  const foundTables = new Set(rows.split(/\r?\n/).filter(Boolean));
  const missingTables = expectedTables.filter((tableName) => !foundTables.has(tableName));

  if (missingTables.length > 0) {
    console.error(`Postgres schema check failed. Missing tables: ${missingTables.join(', ')}`);
    process.exit(1);
  }

  const migrationCount = runPsql('select count(*) from drizzle.__drizzle_migrations;');

  console.log(`Postgres schema check passed: ${expectedTables.length} app tables found.`);
  console.log(`Drizzle migrations recorded: ${migrationCount}`);
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  console.error('Postgres schema check failed.');
  console.error(message);
  console.error('');
  console.error('Expected local container: dealdoor-postgres-local');
  console.error('Start it with: bun run db:pg:up');
  process.exit(1);
}
