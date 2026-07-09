const { spawn } = require('node:child_process');

const port = Number(process.env.SMOKE_PORT || 4325);
const host = process.env.SMOKE_HOST || '127.0.0.1';
const baseUrl = `http://${host}:${port}`;
const connectionString = process.env.DATABASE_URL || 'postgres://dealdoor:dealdoor@localhost:54329/dealdoor';

const routes = [
  { path: '/api/health', expect: 'healthy' },
  { path: '/', expect: 'DealDoor' },
  { path: '/explore', expect: 'Moon Bowl Cafe' },
  { path: '/moon-bowl-cafe', expect: 'Moon Bowl Cafe' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(`${baseUrl}/api/health`);
      return;
    } catch {
      // Server is still starting.
    }

    await sleep(500);
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function fetchRoute(route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  const response = await fetch(`${baseUrl}${route.path}`, { signal: controller.signal });
  clearTimeout(timeout);
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`${route.path} returned ${response.status}: ${body.slice(0, 220)}`);
  }

  if (route.expect && !body.includes(route.expect)) {
    throw new Error(`${route.path} did not include expected text: ${route.expect}`);
  }

  console.log(`${route.path}: ${response.status}`);
}

async function main() {
  const child = spawn(process.execPath, ['dist/server/entry.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DB_DRIVER: 'postgres',
      DATABASE_URL: connectionString,
      HOST: host,
      PORT: String(port),
      NODE_ENV: 'production',
    },
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  const hardTimeout = setTimeout(() => {
    console.error('Postgres app smoke timed out.');
    child.kill('SIGKILL');
    process.exitCode = 1;
  }, 60_000);

  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer();
    for (const route of routes) {
      await fetchRoute(route);
    }

    console.log('Postgres app smoke passed.');
  } catch (error) {
    console.error('Postgres app smoke failed.');
    console.error(error && error.message ? error.message : error);
    if (output.trim()) {
      console.error('');
      console.error('Server output:');
      console.error(output.trim().slice(-4000));
    }
    process.exitCode = 1;
  } finally {
    clearTimeout(hardTimeout);
    if (!child.killed) child.kill('SIGTERM');
    await Promise.race([
      new Promise((resolve) => child.once('exit', resolve)),
      sleep(2000).then(() => {
        if (!child.killed) child.kill('SIGKILL');
      }),
    ]);
  }
}

main();
