const tableOrder = [
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

const columnsByTable = {
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

const timestampColumnsByTable = {
  users: ['created_at', 'updated_at'],
  sessions: ['expires_at', 'created_at'],
  merchants: ['created_at', 'updated_at'],
  shops: ['vacation_until', 'created_at', 'updated_at'],
  deals: ['start_date', 'end_date', 'created_at', 'updated_at'],
  menu_items: ['created_at'],
  shop_special_hours: ['created_at', 'updated_at'],
  analytics_events: ['created_at'],
  notifications: ['read_at', 'created_at'],
  reports: ['reviewed_at', 'created_at'],
};

const booleanColumnsByTable = {
  shops: [
    'is_open', 'vacation_mode', 'accepts_prompt_pay', 'accepts_cash', 'accepts_credit_card',
    'accepts_true_money', 'accepts_rabbit_line_pay', 'wheelchair_accessible', 'stroller_accessible',
    'senior_friendly_restroom', 'elevator_available', 'braille_menu', 'free_parking', 'paid_parking',
    'motorcycle_parking', 'ev_charging', 'pet_friendly', 'pet_menu', 'pet_water_bowl', 'kids_menu',
    'high_chairs', 'play_area', 'baby_changing',
  ],
  deals: ['is_active'],
  shop_special_hours: ['is_closed'],
  notifications: ['read'],
};

function sqliteTimestampToIso(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && Number.isNaN(Number(value))) return value;

  const number = Number(value);
  if (!Number.isFinite(number)) return value;

  const milliseconds = number < 10_000_000_000 ? number * 1000 : number;
  return new Date(milliseconds).toISOString();
}

function normalizeSqliteRow(tableName, row) {
  const next = { ...row };

  for (const column of booleanColumnsByTable[tableName] || []) {
    if (next[column] !== null && next[column] !== undefined) {
      next[column] = Boolean(next[column]);
    }
  }

  for (const column of timestampColumnsByTable[tableName] || []) {
    next[column] = sqliteTimestampToIso(next[column]);
  }

  return next;
}

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

module.exports = {
  booleanColumnsByTable,
  columnsByTable,
  normalizeSqliteRow,
  quoteIdent,
  tableOrder,
  timestampColumnsByTable,
};
