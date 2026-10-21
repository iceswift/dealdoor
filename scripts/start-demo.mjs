import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

if (process.env.DEMO_MODE !== 'true' || process.env.DB_DRIVER === 'postgres') {
  throw new Error('Demo startup requires DEMO_MODE=true and SQLite.');
}

const databasePath = resolve(process.env.DATABASE_URL || '/data/dealdoor-demo.db');
process.env.DATABASE_URL = databasePath;
process.env.DB_DRIVER = 'sqlite';
process.env.MEDIA_LOCAL_ROOT ||= '/data/media';
process.env.HOST ||= '0.0.0.0';
mkdirSync(dirname(databasePath), { recursive: true });

let sqlite = new Database(databasePath);
sqlite.pragma('foreign_keys = ON');
migrate(drizzle(sqlite), { migrationsFolder: './drizzle/migrations' });
const needsSeed = sqlite.prepare('SELECT COUNT(*) AS count FROM users').get().count === 0;
sqlite.close();

if (needsSeed) {
  const result = spawnSync(process.execPath, ['dist/demo-seed.mjs'], { env: process.env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Unable to initialize demo fixtures.');
}

sqlite = new Database(databasePath);
sqlite.pragma('foreign_keys = ON');
if (!sqlite.prepare('SELECT id FROM users WHERE email = ?').get('free-demo@dealdoor.co')) {
  sqlite.transaction(() => {
    const merchant = sqlite.prepare('SELECT password_hash FROM users WHERE email = ?').get('test@dealdoor.co');
    const freeUserId = randomUUID();
    sqlite.prepare('INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(freeUserId, 'free-demo@dealdoor.co', merchant.password_hash, 'Free Demo Merchant', 'merchant', Date.now(), Date.now());
    sqlite.prepare("UPDATE merchants SET user_id = ? WHERE id = (SELECT merchant_id FROM shops WHERE slug = 'aroi-noodle-house')").run(freeUserId);
    sqlite.prepare("UPDATE shops SET tier = 'pro', max_active_deals = 30 WHERE slug = 'moon-bowl-cafe'").run();
    const images = {
      'Birthday Month Free Brownie': 'deal_birthday_brownie.png',
      'Student 10% Off': 'deal_student_matcha.png',
      'Weekend Coffee Set': 'deal_weekend_coffee.png',
      'Valentine Dessert Set': 'deal_valentine_dessert.png',
      'Senior Lunch Deal': 'deal_senior_ramen.png',
      'Monthly Combo Deal': 'deal_monthly_burger.png',
      'Kids Eat Free Sunday': 'deal_kids_meal.png',
      'First Visit 20% Off': 'deal_first_visit_coffee.png',
      'Student Haircut Deal': 'deal_student_haircut.png',
      "Mother's Day Package": 'deal_mothers_day.png',
    };
    for (const [title, file] of Object.entries(images)) {
      sqlite.prepare('UPDATE deals SET image_url = ? WHERE title = ?').run(`/uploads/deals/${file}`, title);
    }
    sqlite.prepare("UPDATE shops SET cover_image = (SELECT image_url FROM deals WHERE deals.shop_id = shops.id LIMIT 1)").run();
    sqlite.prepare("UPDATE menu_items SET image_url = NULL WHERE image_url IS NOT NULL").run();
  })();
  console.log('Demo initialized: Free, Pro, and read-only Admin accounts.');
}
sqlite.close();

const uploadsPath = resolve(process.env.MEDIA_LOCAL_ROOT, 'uploads');
if (!existsSync(uploadsPath)) {
  mkdirSync(uploadsPath, { recursive: true });
  cpSync('./public/uploads', uploadsPath, { recursive: true });
}

await import('../dist/server/entry.mjs');
