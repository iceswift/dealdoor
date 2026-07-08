const Database = require('better-sqlite3');
const path = require('node:path');

const dbPath = process.argv[2] || path.join(process.cwd(), 'db', 'dev.db');

const expected = {
  users: ['id', 'email', 'password_hash', 'name', 'role', 'created_at', 'updated_at'],
  sessions: ['id', 'user_id', 'expires_at', 'created_at'],
  merchants: ['id', 'user_id', 'email', 'name', 'phone', 'created_at', 'updated_at'],
  shops: [
    'id', 'merchant_id', 'slug', 'name', 'description', 'category', 'cover_image', 'logo_image',
    'address', 'latitude', 'longitude', 'phone', 'line_id', 'facebook_url', 'instagram_url',
    'tiktok_url', 'website_url', 'opening_hours', 'is_open', 'vacation_mode', 'vacation_message',
    'vacation_until', 'tier', 'max_active_deals', 'accepts_prompt_pay', 'accepts_cash',
    'accepts_credit_card', 'accepts_true_money', 'accepts_rabbit_line_pay', 'payment_notes',
    'wheelchair_accessible', 'stroller_accessible', 'senior_friendly_restroom', 'elevator_available',
    'braille_menu', 'accessibility_notes', 'free_parking', 'paid_parking', 'motorcycle_parking',
    'ev_charging', 'nearby_bts', 'nearby_mrt', 'parking_notes', 'pet_friendly', 'pet_menu',
    'pet_water_bowl', 'pet_notes', 'kids_menu', 'high_chairs', 'play_area', 'baby_changing',
    'family_notes', 'created_at', 'updated_at',
  ],
  deals: [
    'id', 'shop_id', 'title', 'category', 'description', 'short_description', 'discount_text',
    'conditions', 'coupon_code', 'claim_type', 'image_url', 'start_date', 'end_date', 'is_active',
    'created_at', 'updated_at',
  ],
  menu_items: ['id', 'shop_id', 'name', 'price', 'description', 'image_url', 'sort_order', 'created_at'],
  shop_special_hours: ['id', 'shop_id', 'date', 'is_closed', 'open_time', 'close_time', 'note', 'created_at', 'updated_at'],
  analytics_events: ['id', 'type', 'shop_id', 'deal_id', 'metadata', 'ip', 'user_agent', 'created_at'],
  daily_stats: ['id', 'shop_id', 'date', 'page_views', 'deal_views', 'deal_clicks', 'shares', 'contact_clicks', 'unique_visitors'],
  notifications: ['id', 'user_id', 'shop_id', 'type', 'title', 'message', 'metadata', 'read', 'read_at', 'created_at'],
  reports: ['id', 'reporter_id', 'target_type', 'target_id', 'reason', 'description', 'status', 'reviewed_by', 'reviewed_at', 'resolution', 'created_at'],
};

function getTables(db) {
  return db
    .prepare('SELECT name, type FROM sqlite_master ORDER BY name')
    .all()
    .filter((row) => row.type === 'table' && !row.name.startsWith('sqlite_') && row.name !== '__drizzle_migrations')
    .map((row) => row.name);
}

function getColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${JSON.stringify(table)})`).all().map((row) => row.name);
}

const db = new Database(dbPath, { readonly: true });
const actualTables = new Set(getTables(db));
const errors = [];

for (const [table, columns] of Object.entries(expected)) {
  if (!actualTables.has(table)) {
    errors.push(`Missing table: ${table}`);
    continue;
  }

  const actualColumns = new Set(getColumns(db, table));
  for (const column of columns) {
    if (!actualColumns.has(column)) {
      errors.push(`Missing column: ${table}.${column}`);
    }
  }
}

db.close();

if (errors.length > 0) {
  console.error('Database schema check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Database schema check passed: ${dbPath}`);

