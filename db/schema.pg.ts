import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').default('merchant'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
}));

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

export const merchants = pgTable('merchants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: uniqueIndex('merchants_user_idx').on(table.userId),
}));

export const shops = pgTable('shops', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  merchantId: text('merchant_id').notNull().references(() => merchants.id),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  coverImage: text('cover_image'),
  logoImage: text('logo_image'),
  address: text('address'),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  phone: text('phone'),
  lineId: text('line_id'),
  facebookUrl: text('facebook_url'),
  instagramUrl: text('instagram_url'),
  tiktokUrl: text('tiktok_url'),
  websiteUrl: text('website_url'),
  openingHours: text('opening_hours'),
  isOpen: boolean('is_open').default(true),
  vacationMode: boolean('vacation_mode').default(false),
  vacationMessage: text('vacation_message'),
  vacationUntil: timestamp('vacation_until', { mode: 'date' }),
  tier: text('tier').default('free'),
  maxActiveDeals: integer('max_active_deals').default(6),

  acceptsPromptPay: boolean('accepts_prompt_pay').default(false),
  acceptsCash: boolean('accepts_cash').default(true),
  acceptsCreditCard: boolean('accepts_credit_card').default(false),
  acceptsTrueMoney: boolean('accepts_true_money').default(false),
  acceptsRabbitLinePay: boolean('accepts_rabbit_line_pay').default(false),
  paymentNotes: text('payment_notes'),

  wheelchairAccessible: boolean('wheelchair_accessible').default(false),
  strollerAccessible: boolean('stroller_accessible').default(false),
  seniorFriendlyRestroom: boolean('senior_friendly_restroom').default(false),
  elevatorAvailable: boolean('elevator_available').default(false),
  brailleMenu: boolean('braille_menu').default(false),
  accessibilityNotes: text('accessibility_notes'),

  freeParking: boolean('free_parking').default(false),
  paidParking: boolean('paid_parking').default(false),
  motorcycleParking: boolean('motorcycle_parking').default(false),
  evCharging: boolean('ev_charging').default(false),
  nearbyBts: text('nearby_bts'),
  nearbyMrt: text('nearby_mrt'),
  parkingNotes: text('parking_notes'),

  petFriendly: boolean('pet_friendly').default(false),
  petMenu: boolean('pet_menu').default(false),
  petWaterBowl: boolean('pet_water_bowl').default(false),
  petNotes: text('pet_notes'),

  kidsMenu: boolean('kids_menu').default(false),
  highChairs: boolean('high_chairs').default(false),
  playArea: boolean('play_area').default(false),
  babyChanging: boolean('baby_changing').default(false),
  familyNotes: text('family_notes'),

  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index('shops_slug_idx').on(table.slug),
  categoryIdx: index('shops_category_idx').on(table.category),
  merchantIdx: index('shops_merchant_idx').on(table.merchantId),
}));

export const deals = pgTable('deals', {
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
  startDate: timestamp('start_date', { mode: 'date' }),
  endDate: timestamp('end_date', { mode: 'date' }).notNull(),
  // Null means the deal has no redemption cap.
  maxRedemptions: integer('max_redemptions'),
  redemptionAvailabilityDisplay: text('redemption_availability_display').notNull().default('low_stock'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('deals_shop_idx').on(table.shopId),
  activeIdx: index('deals_active_idx').on(table.isActive, table.endDate),
  categoryIdx: index('deals_category_idx').on(table.category),
}));

export const menuItems = pgTable('menu_items', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  name: text('name').notNull(),
  price: doublePrecision('price'),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('menu_items_shop_idx').on(table.shopId),
}));

export const shopSpecialHours = pgTable('shop_special_hours', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  date: text('date').notNull(),
  isClosed: boolean('is_closed').default(false),
  openTime: text('open_time'),
  closeTime: text('close_time'),
  note: text('note'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopDateIdx: index('shop_special_hours_shop_date_idx').on(table.shopId, table.date),
  shopIdx: index('shop_special_hours_shop_idx').on(table.shopId),
}));

export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type').notNull(),
  shopId: text('shop_id').notNull().references(() => shops.id),
  dealId: text('deal_id').references(() => deals.id),
  metadata: text('metadata'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopIdx: index('analytics_shop_idx').on(table.shopId),
  typeIdx: index('analytics_type_idx').on(table.type),
  createdAtIdx: index('analytics_created_at_idx').on(table.createdAt),
}));

export const dailyStats = pgTable('daily_stats', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  date: text('date').notNull(),
  pageViews: integer('page_views').default(0),
  dealViews: integer('deal_views').default(0),
  dealClicks: integer('deal_clicks').default(0),
  shares: integer('shares').default(0),
  contactClicks: integer('contact_clicks').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
}, (table) => ({
  shopDateIdx: index('daily_stats_shop_date_idx').on(table.shopId, table.date),
}));

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  shopId: text('shop_id').references(() => shops.id),
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  metadata: text('metadata'),
  read: boolean('read').default(false),
  readAt: timestamp('read_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  shopIdx: index('notifications_shop_idx').on(table.shopId),
  readIdx: index('notifications_read_idx').on(table.read),
  userReadCreatedIdx: index('notifications_user_read_created_idx').on(table.userId, table.read, table.createdAt),
  shopReadCreatedIdx: index('notifications_shop_read_created_idx').on(table.shopId, table.read, table.createdAt),
}));

export const notificationDeliveries = pgTable('notification_deliveries', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  notificationId: text('notification_id').notNull().references(() => notifications.id),
  channel: text('channel').notNull(),
  status: text('status').notNull().default('queued'),
  attempts: integer('attempts').notNull().default(0),
  availableAt: timestamp('available_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  lastAttemptAt: timestamp('last_attempt_at', { mode: 'date' }),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
  providerMessageId: text('provider_message_id'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  notificationIdx: index('notification_deliveries_notification_idx').on(table.notificationId),
  queueIdx: index('notification_deliveries_queue_idx').on(table.status, table.availableAt),
}));

export const notificationPreferences = pgTable('notification_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id),
  inAppEnabled: boolean('in_app_enabled').default(true),
  dealUpdates: boolean('deal_updates').default(true),
  milestones: boolean('milestones').default(true),
  reports: boolean('reports').default(true),
  systemUpdates: boolean('system_updates').default(true),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});

export const jobLocks = pgTable('job_locks', {
  name: text('name').primaryKey(),
  ownerToken: text('owner_token').notNull(),
  lockedUntil: timestamp('locked_until', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
});

export const jobRuns = pgTable('job_runs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  finishedAt: timestamp('finished_at', { mode: 'date' }),
  durationMs: integer('duration_ms'),
  output: text('output'),
  error: text('error'),
}, (table) => ({
  nameStartedIdx: index('job_runs_name_started_idx').on(table.name, table.startedAt),
  statusStartedIdx: index('job_runs_status_started_idx').on(table.status, table.startedAt),
}));

export const adminAuditLogs = pgTable('admin_audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  actorUserId: text('actor_user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  actorCreatedIdx: index('admin_audit_logs_actor_created_idx').on(table.actorUserId, table.createdAt),
  targetCreatedIdx: index('admin_audit_logs_target_created_idx').on(table.targetType, table.targetId, table.createdAt),
  actionCreatedIdx: index('admin_audit_logs_action_created_idx').on(table.action, table.createdAt),
}));

export const reports = pgTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reporterId: text('reporter_id').references(() => users.id),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { mode: 'date' }),
  resolution: text('resolution'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  statusIdx: index('reports_status_idx').on(table.status),
  targetIdx: index('reports_target_idx').on(table.targetType, table.targetId),
}));

// ─── Deal Boost ─────────────────────────────────────────

export const boostWallets = pgTable('boost_wallets', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  includedCreditsBalance: integer('included_credits_balance').notNull().default(0),
  purchasedCreditsBalance: integer('purchased_credits_balance').notNull().default(0),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopUnique: uniqueIndex('boost_wallets_shop_unique').on(table.shopId),
}));

export const boostCreditOrders = pgTable('boost_credit_orders', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  status: text('status').notNull().default('pending'),
  provider: text('provider'),
  providerReference: text('provider_reference'),
  currency: text('currency').notNull().default('THB'),
  amountMinor: integer('amount_minor').notNull(),
  creditQuantity: integer('credit_quantity').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  paidAt: timestamp('paid_at', { mode: 'date' }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopStatusCreatedIdx: index('boost_credit_orders_shop_status_created_idx').on(table.shopId, table.status, table.createdAt),
  providerReferenceUnique: uniqueIndex('boost_credit_orders_provider_reference_unique').on(table.provider, table.providerReference),
}));

export const boostCampaigns = pgTable('boost_campaigns', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  shopId: text('shop_id').notNull().references(() => shops.id),
  dealId: text('deal_id').notNull().references(() => deals.id),
  createdByUserId: text('created_by_user_id').references(() => users.id),
  status: text('status').notNull().default('scheduled'),
  creditSource: text('credit_source').notNull(),
  creditsReserved: integer('credits_reserved').notNull(),
  startsAt: timestamp('starts_at', { mode: 'date' }).notNull(),
  endsAt: timestamp('ends_at', { mode: 'date' }).notNull(),
  stoppedAt: timestamp('stopped_at', { mode: 'date' }),
  stopReason: text('stop_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  shopStatusEndIdx: index('boost_campaigns_shop_status_end_idx').on(table.shopId, table.status, table.endsAt),
  dealStatusEndIdx: index('boost_campaigns_deal_status_end_idx').on(table.dealId, table.status, table.endsAt),
}));

export const boostTransactions = pgTable('boost_transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  walletId: text('wallet_id').notNull().references(() => boostWallets.id),
  shopId: text('shop_id').notNull().references(() => shops.id),
  campaignId: text('campaign_id').references(() => boostCampaigns.id),
  orderId: text('order_id').references(() => boostCreditOrders.id),
  type: text('type').notNull(),
  creditSource: text('credit_source').notNull(),
  creditDelta: integer('credit_delta').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  idempotencyKey: text('idempotency_key'),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  walletCreatedIdx: index('boost_transactions_wallet_created_idx').on(table.walletId, table.createdAt),
  shopCreatedIdx: index('boost_transactions_shop_created_idx').on(table.shopId, table.createdAt),
  campaignCreatedIdx: index('boost_transactions_campaign_created_idx').on(table.campaignId, table.createdAt),
  idempotencyKeyUnique: uniqueIndex('boost_transactions_idempotency_key_unique').on(table.idempotencyKey),
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
  boostWallet: one(boostWallets),
  boostCreditOrders: many(boostCreditOrders),
  boostCampaigns: many(boostCampaigns),
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

export const boostWalletsRelations = relations(boostWallets, ({ one, many }) => ({
  shop: one(shops, {
    fields: [boostWallets.shopId],
    references: [shops.id],
  }),
  transactions: many(boostTransactions),
}));

export const boostCreditOrdersRelations = relations(boostCreditOrders, ({ one, many }) => ({
  shop: one(shops, {
    fields: [boostCreditOrders.shopId],
    references: [shops.id],
  }),
  transactions: many(boostTransactions),
}));

export const boostCampaignsRelations = relations(boostCampaigns, ({ one, many }) => ({
  shop: one(shops, {
    fields: [boostCampaigns.shopId],
    references: [shops.id],
  }),
  deal: one(deals, {
    fields: [boostCampaigns.dealId],
    references: [deals.id],
  }),
  transactions: many(boostTransactions),
}));

export const boostTransactionsRelations = relations(boostTransactions, ({ one }) => ({
  wallet: one(boostWallets, {
    fields: [boostTransactions.walletId],
    references: [boostWallets.id],
  }),
  shop: one(shops, {
    fields: [boostTransactions.shopId],
    references: [shops.id],
  }),
  campaign: one(boostCampaigns, {
    fields: [boostTransactions.campaignId],
    references: [boostCampaigns.id],
  }),
  order: one(boostCreditOrders, {
    fields: [boostTransactions.orderId],
    references: [boostCreditOrders.id],
  }),
}));

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
export type BoostWallet = typeof boostWallets.$inferSelect;
export type BoostCreditOrder = typeof boostCreditOrders.$inferSelect;
export type BoostCampaign = typeof boostCampaigns.$inferSelect;
export type BoostTransaction = typeof boostTransactions.$inferSelect;
