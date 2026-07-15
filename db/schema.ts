// db/schema.ts

import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Users (Authentication) ──────────────────────────────

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('merchant'), // merchant | admin
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
}));

// ─── Merchants ───────────────────────────────────────────

export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  // Null is allowed for sample/imported shops. A claimed merchant can belong to one user only.
  userIdx: uniqueIndex('merchants_user_idx').on(table.userId),
}));

// ─── Shops ───────────────────────────────────────────────

export const shops = sqliteTable('shops', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  merchantId: text('merchant_id').notNull().references(() => merchants.id),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  coverImage: text('cover_image'),
  logoImage: text('logo_image'),
  address: text('address'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  phone: text('phone'),
  lineId: text('line_id'),
  facebookUrl: text('facebook_url'),
  instagramUrl: text('instagram_url'),
  tiktokUrl: text('tiktok_url'),
  websiteUrl: text('website_url'),
  openingHours: text('opening_hours'),
  isOpen: integer('is_open', { mode: 'boolean' }).default(true),
  vacationMode: integer('vacation_mode', { mode: 'boolean' }).default(false),
  vacationMessage: text('vacation_message'),
  vacationUntil: integer('vacation_until', { mode: 'timestamp' }),
  tier: text('tier').default('free'),
  maxActiveDeals: integer('max_active_deals').default(6),

  // ─── Payment Methods ─────────────────────────────────
  acceptsPromptPay: integer('accepts_prompt_pay', { mode: 'boolean' }).default(false),
  acceptsCash: integer('accepts_cash', { mode: 'boolean' }).default(true),
  acceptsCreditCard: integer('accepts_credit_card', { mode: 'boolean' }).default(false),
  acceptsTrueMoney: integer('accepts_true_money', { mode: 'boolean' }).default(false),
  acceptsRabbitLinePay: integer('accepts_rabbit_line_pay', { mode: 'boolean' }).default(false),
  paymentNotes: text('payment_notes'),

  // ─── Accessibility ───────────────────────────────────
  wheelchairAccessible: integer('wheelchair_accessible', { mode: 'boolean' }).default(false),
  strollerAccessible: integer('stroller_accessible', { mode: 'boolean' }).default(false),
  seniorFriendlyRestroom: integer('senior_friendly_restroom', { mode: 'boolean' }).default(false),
  elevatorAvailable: integer('elevator_available', { mode: 'boolean' }).default(false),
  brailleMenu: integer('braille_menu', { mode: 'boolean' }).default(false),
  accessibilityNotes: text('accessibility_notes'),

  // ─── Parking & Transport ─────────────────────────────
  freeParking: integer('free_parking', { mode: 'boolean' }).default(false),
  paidParking: integer('paid_parking', { mode: 'boolean' }).default(false),
  motorcycleParking: integer('motorcycle_parking', { mode: 'boolean' }).default(false),
  evCharging: integer('ev_charging', { mode: 'boolean' }).default(false),
  nearbyBts: text('nearby_bts'),
  nearbyMrt: text('nearby_mrt'),
  parkingNotes: text('parking_notes'),

  // ─── Pet Policy ──────────────────────────────────────
  petFriendly: integer('pet_friendly', { mode: 'boolean' }).default(false),
  petMenu: integer('pet_menu', { mode: 'boolean' }).default(false),
  petWaterBowl: integer('pet_water_bowl', { mode: 'boolean' }).default(false),
  petNotes: text('pet_notes'),

  // ─── Family Facilities ───────────────────────────────
  kidsMenu: integer('kids_menu', { mode: 'boolean' }).default(false),
  highChairs: integer('high_chairs', { mode: 'boolean' }).default(false),
  playArea: integer('play_area', { mode: 'boolean' }).default(false),
  babyChanging: integer('baby_changing', { mode: 'boolean' }).default(false),
  familyNotes: text('family_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index('shops_slug_idx').on(table.slug),
  categoryIdx: index('shops_category_idx').on(table.category),
  merchantIdx: index('shops_merchant_idx').on(table.merchantId),
}));

// ─── Deals ───────────────────────────────────────────────

export const deals = sqliteTable('deals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  shortDescription: text('short_description'),
  discountText: text('discount_text'),
  conditions: text('conditions'),
  couponCode: text('coupon_code'),
  claimType: text('claim_type').notNull(),
  imageUrl: text('image_url'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  // Null means the deal has no redemption cap.
  maxRedemptions: integer('max_redemptions'),
  redemptionAvailabilityDisplay: text('redemption_availability_display').notNull().default('low_stock'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('deals_shop_idx').on(table.shopId),
  activeIdx: index('deals_active_idx').on(table.isActive, table.endDate),
  categoryIdx: index('deals_category_idx').on(table.category),
}));

// ─── Menu Items ──────────────────────────────────────────

export const menuItems = sqliteTable('menu_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  name: text('name').notNull(),
  price: real('price'),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('menu_items_shop_idx').on(table.shopId),
}));

// ─── Relations ───────────────────────────────────────────

export const shopSpecialHours = sqliteTable('shop_special_hours', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  date: text('date').notNull(), // YYYY-MM-DD
  isClosed: integer('is_closed', { mode: 'boolean' }).default(false),
  openTime: text('open_time'),
  closeTime: text('close_time'),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopDateIdx: index('shop_special_hours_shop_date_idx').on(table.shopId, table.date),
  shopIdx: index('shop_special_hours_shop_idx').on(table.shopId),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  merchant: one(merchants),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  shops: many(shops),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [shops.merchantId],
    references: [merchants.id],
  }),
  deals: many(deals),
  menuItems: many(menuItems),
  specialHours: many(shopSpecialHours),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  shop: one(shops, {
    fields: [deals.shopId],
    references: [shops.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  shop: one(shops, {
    fields: [menuItems.shopId],
    references: [shops.id],
  }),
}));

export const shopSpecialHoursRelations = relations(shopSpecialHours, ({ one }) => ({
  shop: one(shops, {
    fields: [shopSpecialHours.shopId],
    references: [shops.id],
  }),
}));

// ─── Analytics Events ────────────────────────────────────

export const analyticsEvents = sqliteTable('analytics_events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(), // page_view, deal_view, deal_click, deal_share, contact_click
  shopId: text('shop_id').notNull().references(() => shops.id),
  dealId: text('deal_id').references(() => deals.id),
  metadata: text('metadata'), // JSON: { source, ref, etc. }
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('analytics_shop_idx').on(table.shopId),
  typeIdx: index('analytics_type_idx').on(table.type),
  createdAtIdx: index('analytics_created_at_idx').on(table.createdAt),
}));

// ─── Daily Stats (Aggregated) ────────────────────────────

export const dailyStats = sqliteTable('daily_stats', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  date: text('date').notNull(), // YYYY-MM-DD
  pageViews: integer('page_views').default(0),
  dealViews: integer('deal_views').default(0),
  dealClicks: integer('deal_clicks').default(0),
  shares: integer('shares').default(0),
  contactClicks: integer('contact_clicks').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
}, (table) => ({
  shopDateIdx: index('daily_stats_shop_date_idx').on(table.shopId, table.date),
}));

// ─── Notifications ───────────────────────────────────────

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  shopId: text('shop_id').references(() => shops.id),
  type: text('type').notNull(), // deal_expiring, deal_expired, milestone, system
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'), // JSON: { dealId, dealTitle, etc. }
  read: integer('read', { mode: 'boolean' }).default(false),
  readAt: integer('read_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  shopIdx: index('notifications_shop_idx').on(table.shopId),
  readIdx: index('notifications_read_idx').on(table.read),
}));

export const notificationDeliveries = sqliteTable('notification_deliveries', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  notificationId: text('notification_id').notNull().references(() => notifications.id),
  channel: text('channel').notNull(), // in_app | email | web_push
  status: text('status').notNull().default('queued'), // queued | processing | delivered | failed | skipped
  attempts: integer('attempts').notNull().default(0),
  availableAt: integer('available_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  providerMessageId: text('provider_message_id'),
  lastError: text('last_error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  notificationIdx: index('notification_deliveries_notification_idx').on(table.notificationId),
  queueIdx: index('notification_deliveries_queue_idx').on(table.status, table.availableAt),
}));

export const notificationPreferences = sqliteTable('notification_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id),
  inAppEnabled: integer('in_app_enabled', { mode: 'boolean' }).default(true),
  dealUpdates: integer('deal_updates', { mode: 'boolean' }).default(true),
  milestones: integer('milestones', { mode: 'boolean' }).default(true),
  reports: integer('reports', { mode: 'boolean' }).default(true),
  systemUpdates: integer('system_updates', { mode: 'boolean' }).default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const jobLocks = sqliteTable('job_locks', {
  name: text('name').primaryKey(),
  ownerToken: text('owner_token').notNull(),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const jobRuns = sqliteTable('job_runs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  status: text('status').notNull(), // running | succeeded | failed | skipped
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  output: text('output'),
  error: text('error'),
}, (table) => ({
  nameStartedIdx: index('job_runs_name_started_idx').on(table.name, table.startedAt),
  statusStartedIdx: index('job_runs_status_started_idx').on(table.status, table.startedAt),
}));

export const adminAuditLogs = sqliteTable('admin_audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  actorUserId: text('actor_user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: text('metadata'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  actorCreatedIdx: index('admin_audit_logs_actor_created_idx').on(table.actorUserId, table.createdAt),
  targetCreatedIdx: index('admin_audit_logs_target_created_idx').on(table.targetType, table.targetId, table.createdAt),
  actionCreatedIdx: index('admin_audit_logs_action_created_idx').on(table.action, table.createdAt),
}));

// ─── Reports ─────────────────────────────────────────────

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reporterId: text('reporter_id').references(() => users.id),
  targetType: text('target_type').notNull(), // shop | deal
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(), // spam, fake, offensive, scam, expired, incorrect, other
  description: text('description'),
  status: text('status').default('pending'), // pending, reviewed, resolved, dismissed
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  resolution: text('resolution'), // removed, warning, no_action
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  statusIdx: index('reports_status_idx').on(table.status),
  targetIdx: index('reports_target_idx').on(table.targetType, table.targetId),
}));

// Export inferred types for Drizzle models
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Merchant = typeof merchants.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type DailyStats = typeof dailyStats.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type JobRun = typeof jobRuns.$inferSelect;
export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type Report = typeof reports.$inferSelect;
