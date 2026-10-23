import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import Database from 'better-sqlite3';
import sharp from 'sharp';

// Always use disposable local fixtures, never the caller's DATABASE_URL or a remote URL.
await mkdir(resolve('tmp'), { recursive: true });
const root = await mkdtemp(resolve('tmp/demo-smoke-'));
const databasePath = join(root, 'demo.db');
const reservation = createServer();
reservation.listen(0, '127.0.0.1');
await once(reservation, 'listening');
const port = reservation.address().port;
await new Promise((done) => reservation.close(done));
const origin = `http://127.0.0.1:${port}`;
const allowDemoWrites = process.argv.includes('--allow-demo-writes');
const env = {
  ...process.env,
  DEMO_MODE: 'true', DB_DRIVER: 'sqlite', DATABASE_URL: databasePath,
  STORAGE_DRIVER: 'local', MEDIA_LOCAL_ROOT: join(root, 'media'),
  HOST: '127.0.0.1', PORT: String(port), NODE_ENV: 'production',
  DEMO_ALLOW_UPLOADS: String(allowDemoWrites),
  DEMO_ALLOW_REGISTRATION: String(allowDemoWrites),
};
let child;
let output = '';
let checks = 0;

async function start() {
  output = '';
  child = spawn(process.execPath, ['scripts/start-server.mjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', (error) => { output += error.message; });
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    assert.equal(child.exitCode, null, 'Demo server exited before readiness');
    try {
      const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(1500) });
      if (response.ok) return;
    } catch { /* Waiting for migrations, seed, and server binding. */ }
    await new Promise((done) => setTimeout(done, 250));
  }
  throw new Error('Demo readiness timed out');
}

async function stop() {
  if (!child || child.exitCode !== null) return;
  const stopped = once(child, 'exit');
  const timeout = setTimeout(() => child.kill('SIGKILL'), 5000);
  child.kill('SIGTERM');
  try { await stopped; } finally { clearTimeout(timeout); }
}

async function check(path, status = 200, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options, headers: { origin, ...options.headers },
    redirect: 'manual', signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, status, `${options.method || 'GET'} ${path}`);
  checks++;
  console.log(`PASS ${options.method || 'GET'} ${path}: ${status}`);
  return response;
}

async function login(email) {
  const response = await check('/api/auth/login', 200, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const cookies = response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ');
  assert.ok(cookies, `Session missing for ${email}`);
  assert.equal((await response.json()).success, true);
  return { cookie: cookies };
}

try {
  await mkdir(join(root, 'media'), { recursive: true });
  await start();
  const fixtures = new Database(databasePath, { readonly: true });
  const shopId = fixtures.prepare("SELECT id FROM shops WHERE slug = 'moon-bowl-cafe'").get().id;
  fixtures.close();
  for (const path of ['/', '/en', '/deals', '/explore', '/pricing', '/terms', '/privacy', '/cookies', '/moon-bowl-cafe']) {
    await check(path);
  }
  if (process.env.SMOKE_EXPECT_SITE_URL) {
    const expectedOrigin = new URL(process.env.SMOKE_EXPECT_SITE_URL).origin;
    const html = await (await check('/moon-bowl-cafe')).text();
    assert.ok(html.includes(`rel="canonical" href="${expectedOrigin}/moon-bowl-cafe"`));
    assert.ok(html.includes(`"url":"${expectedOrigin}/moon-bowl-cafe"`));
    assert.ok(!html.includes('https://dealdoor.co/'));
    const proxyHeaders = {
      origin: expectedOrigin,
      'x-forwarded-proto': new URL(expectedOrigin).protocol.slice(0, -1),
      'x-forwarded-host': new URL(expectedOrigin).host,
    };
    await check('/api/auth/logout', 200, { method: 'POST', headers: proxyHeaders });
    await check('/api/auth/logout', 403, { method: 'POST', headers: { ...proxyHeaders, origin: 'https://untrusted.example' } });
  }
  await check('/dashboard', 302);
  if (!allowDemoWrites) {
    await check('/auth/register', 302);
    const loginPage = await (await check('/auth/login')).text();
    assert.ok(!loginPage.includes('href="/auth/register"'));
    for (const path of ['/api/auth/register', '/api/auth/register/', '/api/upload', '/api/upload/', '/en/api/upload']) {
      const blocked = await check(path, 403, { method: 'POST' });
      assert.equal((await blocked.json()).error.code, 'DEMO_FEATURE_DISABLED');
    }
  } else {
    await check('/auth/register');
  }
  await check('/api/admin/stats', 401);
  const pro = await login('test@dealdoor.co');
  await check(`/api/shops/${shopId}`, 200, {
    method: 'PUT', headers: { ...pro, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Demo persistence check' }),
  });
  const file = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ff5522' } }).png().toBuffer();
  const upload = new FormData();
  upload.set('file', new Blob([file], { type: 'image/png' }), 'smoke.png');
  upload.set('type', 'logo');
  let uploadedUrl;
  if (allowDemoWrites) {
    const uploaded = await check('/api/upload', 201, { method: 'POST', headers: pro, body: upload });
    uploadedUrl = (await uploaded.json()).data.url;
    assert.match(uploadedUrl, /^\/uploads\/logos\/[\w-]+\.webp$/);
    const uploadedImage = await check(uploadedUrl);
    assert.equal((await sharp(Buffer.from(await uploadedImage.arrayBuffer())).metadata()).format, 'webp');
  } else {
    const blocked = await check('/api/upload', 403, { method: 'POST', headers: pro, body: upload });
    assert.equal((await blocked.json()).error.code, 'DEMO_FEATURE_DISABLED');
    const form = await (await check('/dashboard/deals/new', 200, { headers: pro })).text();
    assert.ok(!form.includes('type="file"'));
    assert.match(form, /Demo:/);
  }
  for (const path of ['/dashboard', '/dashboard/edit', '/dashboard/deals', '/dashboard/analytics', '/dashboard/boosts', '/dashboard/notifications']) {
    await check(path, 200, { headers: pro });
  }
  const free = await login('free-demo@dealdoor.co');
  await check('/dashboard', 200, { headers: free });
  await check('/api/admin/stats', 403, { headers: free });
  await check(`/api/shops/${shopId}`, 403, {
    method: 'PUT', headers: { ...free, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Must not overwrite another shop' }),
  });
  const admin = await login('admin@dealdoor.co');
  await check('/admin/moderation', 200, { headers: admin });
  await check('/api/admin/stats', 200, { headers: admin });
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const denied = await check('/api/admin/jobs', 403, { method, headers: admin });
    assert.equal((await denied.json()).error.code, 'DEMO_READ_ONLY');
  }
  await check('/api/auth/logout', 200, { method: 'POST', headers: admin });
  await check('/api/admin/stats', 401, { headers: admin });
  await check('/api/internal/notifications/scan', 403, { method: 'POST' });
  const qr = await check('/api/qr/moon-bowl-cafe');
  assert.match(qr.headers.get('content-type'), /image\/svg\+xml/);
  assert.match(await qr.text(), /<svg/);
  await check('/api/qr/nonexistent-demo-shop', 404);
  const assetPath = '/uploads/deals/deal_birthday_brownie.png';
  const image = await check(assetPath);
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), await readFile(`public${assetPath}`));
  await check('/uploads/%2e%2e%2fpackage.json', 404);
  await stop();

  const sqlite = new Database(databasePath, { readonly: true });
  const before = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  sqlite.close();
  await start();
  assert.match(await (await check('/moon-bowl-cafe')).text(), /Demo persistence check/);
  const reopened = new Database(databasePath, { readonly: true });
  assert.equal(reopened.prepare('SELECT COUNT(*) AS count FROM users').get().count, before);
  reopened.close();
  await check(assetPath);
  if (uploadedUrl) await check(uploadedUrl);
  console.log(`Demo smoke passed: ${checks} HTTP checks; restart preserved edits, accounts, and media.`);
} catch (error) {
  console.error(error);
  console.error(output.slice(-4000));
  process.exitCode = 1;
} finally {
  await stop();
  console.log(`Isolated fixtures retained at ${root}`);
}
