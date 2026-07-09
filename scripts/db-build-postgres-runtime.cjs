const { spawnSync } = require('node:child_process');

process.env.DB_DRIVER = 'postgres';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://dealdoor:dealdoor@localhost:54329/dealdoor';

const packageRunner = process.env.npm_execpath && process.env.npm_execpath.toLowerCase().includes('bun')
  ? process.env.npm_execpath
  : 'bun';

const result = spawnSync(packageRunner, ['run', 'build'], {
  cwd: process.cwd(),
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
