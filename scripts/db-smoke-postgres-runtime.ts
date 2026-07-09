import { createId } from '@paralleldrive/cuid2';
import { and, count, desc, eq, gte, sql } from 'drizzle-orm';
import { db, closePostgresDb } from '../src/lib/db.postgres';
import {
  analyticsEvents,
  deals,
  menuItems,
  reports,
  sessions,
  shopSpecialHours,
  shops,
  users,
} from '../src/lib/db-schema.postgres';

async function tableCount(label: string, table: any) {
  const rows = await db.select({ value: count() }).from(table);
  const value = Number(rows[0]?.value || 0);
  console.log(`${label}: ${value}`);
  return value;
}

async function main() {
  const counts = {
    users: await tableCount('users', users),
    sessions: await tableCount('sessions', sessions),
    shops: await tableCount('shops', shops),
    deals: await tableCount('deals', deals),
    menuItems: await tableCount('menu_items', menuItems),
    shopSpecialHours: await tableCount('shop_special_hours', shopSpecialHours),
    analyticsEvents: await tableCount('analytics_events', analyticsEvents),
    reports: await tableCount('reports', reports),
  };

  if (counts.users < 1 || counts.shops < 1 || counts.deals < 1) {
    throw new Error('Postgres runtime smoke requires imported users, shops, and deals.');
  }

  const [firstShop] = await db
    .select({
      id: shops.id,
      slug: shops.slug,
      name: shops.name,
      category: shops.category,
    })
    .from(shops)
    .orderBy(shops.createdAt)
    .limit(1);

  if (!firstShop) throw new Error('No shop found after import.');
  console.log(`first_shop: ${firstShop.slug} (${firstShop.name})`);

  const now = new Date();
  const activeDeals = await db
    .select({
      id: deals.id,
      title: deals.title,
      shopId: deals.shopId,
      endDate: deals.endDate,
    })
    .from(deals)
    .where(and(eq(deals.isActive, true), gte(deals.endDate, now)))
    .orderBy(desc(deals.createdAt))
    .limit(5);

  console.log(`active_deals_sample: ${activeDeals.length}`);

  const statsByDay = await db
    .select({
      day: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`,
      type: analyticsEvents.type,
      value: count(),
    })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.shopId, firstShop.id))
    .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`, analyticsEvents.type)
    .limit(10);

  console.log(`analytics_group_sample: ${statsByDay.length}`);

  const smokeEventId = createId();
  await db.insert(analyticsEvents).values({
    id: smokeEventId,
    type: 'page_view',
    shopId: firstShop.id,
    metadata: JSON.stringify({ source: 'postgres_runtime_smoke' }),
    createdAt: new Date(),
  });

  const smokeRows = await db
    .select({ id: analyticsEvents.id })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.id, smokeEventId))
    .limit(1);

  if (smokeRows.length !== 1) {
    throw new Error('Postgres runtime smoke insert/select failed.');
  }

  await db.delete(analyticsEvents).where(eq(analyticsEvents.id, smokeEventId));

  console.log('Postgres runtime smoke passed.');
}

main()
  .catch((error) => {
    console.error('Postgres runtime smoke failed.');
    console.error(error && error.message ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePostgresDb();
  });
