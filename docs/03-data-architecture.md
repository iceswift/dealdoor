# DealDoor — Data Architecture

---

## 1. Tech Stack

| Component | Technology |
|-----------|------------|
| Database | SQLite (file-based) |
| ORM | Drizzle ORM |
| Schema | TypeScript schema definitions |
| Migrations | Drizzle Kit |
| Admin UI | Drizzle Studio |

---

## 2. Database Schema

### 2.1 Entity Relationship

```
┌─────────────┐       ┌─────────────┐
│   merchants │ 1───N │    shops    │
└─────────────┘       └─────────────┘
                             │
                             │ 1
                             │
                             │ N
                       ┌─────────────┐
                       │    deals    │
                       └─────────────┘
                             │
                             │ 1
                             │
                             │ N
                       ┌─────────────┐
                       │ menu_items  │
                       └─────────────┘
```

### 2.2 Table: merchants

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique merchant ID |
| email | TEXT | UNIQUE, NOT NULL | Login email |
| name | TEXT | NOT NULL | Merchant display name |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

### 2.3 Table: shops

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique shop ID |
| merchant_id | TEXT | FK → merchants.id | Owner |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| name | TEXT | NOT NULL | Shop name |
| description | TEXT | | Short description |
| category | TEXT | NOT NULL | Shop category |
| cover_image | TEXT | | Cover image URL |
| logo_image | TEXT | | Logo image URL |
| address | TEXT | | Full address |
| latitude | REAL | | Map latitude |
| longitude | REAL | | Map longitude |
| phone | TEXT | | Phone number |
| line_id | TEXT | | LINE ID or link |
| facebook_url | TEXT | | Facebook page URL |
| instagram_url | TEXT | | Instagram profile URL |
| website_url | TEXT | | Website URL |
| opening_hours | TEXT | | JSON string of hours |
| is_open | INTEGER | DEFAULT 1 | Open/closed status |
| tier | TEXT | DEFAULT 'free' | free or pro |
| max_active_deals | INTEGER | DEFAULT 6 | Deal limit based on tier |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

### 2.4 Table: deals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique deal ID |
| shop_id | TEXT | FK → shops.id | Parent shop |
| title | TEXT | NOT NULL | Deal title |
| category | TEXT | NOT NULL | Deal category |
| description | TEXT | | Full description |
| short_description | TEXT | | Brief summary |
| discount_text | TEXT | | Discount/benefit text |
| conditions | TEXT | | Terms and conditions |
| coupon_code | TEXT | | Optional coupon code |
| claim_type | TEXT | NOT NULL | copy_code, show_at_shop, contact_shop, open_line |
| image_url | TEXT | | Deal image |
| start_date | INTEGER | | Unix timestamp, null = immediately |
| end_date | INTEGER | NOT NULL | Unix timestamp, expiration |
| is_active | INTEGER | DEFAULT 1 | Manual toggle |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

### 2.5 Table: menu_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Unique item ID |
| shop_id | TEXT | FK → shops.id | Parent shop |
| name | TEXT | NOT NULL | Item name |
| price | REAL | | Price in THB |
| description | TEXT | | Short description |
| image_url | TEXT | | Item image |
| sort_order | INTEGER | DEFAULT 0 | Display order |
| created_at | INTEGER | NOT NULL | Unix timestamp |

---

## 3. Drizzle Schema (TypeScript)

```typescript
// db/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ─── Merchants ───────────────────────────────────────────

export const merchants = sqliteTable('merchants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

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
  websiteUrl: text('website_url'),
  openingHours: text('opening_hours'),
  isOpen: integer('is_open', { mode: 'boolean' }).default(true),
  tier: text('tier').default('free'),
  maxActiveDeals: integer('max_active_deals').default(6),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

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
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

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
});

// ─── Relations ───────────────────────────────────────────

export const merchantsRelations = relations(merchants, ({ many }) => ({
  shops: many(shops),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [shops.merchantId],
    referenceFields: [merchants.id],
  }),
  deals: many(deals),
  menuItems: many(menuItems),
}));

export const dealsRelations = relations(deals, ({ one }) => ({
  shop: one(shops, {
    fields: [deals.shopId],
    referenceFields: [shops.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  shop: one(shops, {
    fields: [menuItems.shopId],
    referenceFields: [shops.id],
  }),
}));
```

---

## 4. Enums / Constants

### 4.1 Shop Categories

```typescript
export const SHOP_CATEGORIES = [
  'restaurant',
  'cafe',
  'dessert',
  'beauty',
  'clinic',
  'retail',
  'service',
  'other',
] as const;

export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = {
  restaurant: 'ร้านอาหาร',
  cafe: 'คาเฟ่',
  dessert: 'ของหวาน',
  beauty: 'ความงาม',
  clinic: 'คลินิก',
  retail: 'ร้านค้า',
  service: 'บริการ',
  other: 'อื่นๆ',
};
```

### 4.2 Deal Categories

```typescript
export const DEAL_CATEGORIES = [
  'birthday',
  'monthly',
  'festival',
  'special_day',
  'senior',
  'kids',
  'student',
  'flash',
  'custom',
] as const;

export const DEAL_CATEGORY_LABELS: Record<DealCategory, string> = {
  birthday: 'Birthday',
  monthly: 'รายเดือน',
  festival: 'เทศกาล',
  special_day: 'วันพิเศษ',
  senior: 'ผู้สูงอายุ',
  kids: 'เด็ก',
  student: 'นักเรียน/นักศึกษา',
  flash: 'Flash Deal',
  custom: 'ทั่วไป',
};

export const DEAL_CATEGORY_COLORS: Record<DealCategory, string> = {
  birthday: '#EC4899',
  monthly: '#8B5CF6',
  festival: '#F59E0B',
  special_day: '#EF4444',
  senior: '#6366F1',
  kids: '#14B8A6',
  student: '#3B82F6',
  flash: '#F97316',
  custom: '#6B7280',
};
```

### 4.3 Claim Types

```typescript
export const CLAIM_TYPES = [
  'copy_code',
  'show_at_shop',
  'contact_shop',
  'open_line',
] as const;

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  copy_code: 'คัดลอกโค้ด',
  show_at_shop: 'แสดงที่ร้าน',
  contact_shop: 'ติดต่อร้าน',
  open_line: 'เปิด LINE',
};
```

---

## 5. Mock Data

### 5.1 Moon Bowl Cafe

```typescript
export const mockShop1: Shop = {
  id: 'shop_001',
  merchantId: 'merchant_001',
  slug: 'moon-bowl-cafe',
  name: 'Moon Bowl Cafe',
  description: 'คาเฟ่ขนมหวานสไตล์เกาหลี ย่านสยาม',
  category: 'cafe',
  coverImage: '/images/moon-bowl-cover.jpg',
  logoImage: '/images/moon-bowl-logo.jpg',
  address: '123 ซอยสยามสแควร์ 5 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330',
  latitude: 13.7466,
  longitude: 100.5348,
  phone: '081-234-5678',
  lineId: '@moonbowlcafe',
  facebookUrl: 'https://facebook.com/moonbowlcafe',
  instagramUrl: 'https://instagram.com/moonbowlcafe',
  websiteUrl: null,
  openingHours: JSON.stringify({
    mon: '10:00-20:00',
    tue: '10:00-20:00',
    wed: '10:00-20:00',
    thu: '10:00-20:00',
    fri: '10:00-21:00',
    sat: '09:00-21:00',
    sun: '09:00-20:00',
  }),
  isOpen: true,
  tier: 'free',
  maxActiveDeals: 6,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-07-01'),
};

export const mockShop1Deals: Deal[] = [
  {
    id: 'deal_001',
    shopId: 'shop_001',
    title: 'Birthday Month Free Brownie',
    category: 'birthday',
    description: 'ฟรีบราวนี่ 1 ชิ้น เมื่อสั่งเครื่องดื่มใดก็ได้ 1 แก้ว สำหรับเดือนเกิด',
    shortDescription: 'ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม',
    discountText: 'ฟรีบราวนี่ 1 ชิ้น',
    conditions: '• สำหรับเดือนเกิดเท่านั้น\n• แสดงบัตรประชาชน\n• ลูกค้า 1 ท่าน / 1 สิทธิ์\n• ไม่รวมโปรโมชันอื่น',
    couponCode: 'MOONBDAY2025',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-07-31'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_002',
    shopId: 'shop_001',
    title: 'Student 10% Off',
    category: 'student',
    description: 'ลด 10% สำหรับนักเรียน/นักศึกษา เมื่อแสดงบัตรนักเรียน/นักศึกษา',
    shortDescription: 'ลด 10% สำหรับนักเรียน',
    discountText: 'ลด 10%',
    conditions: '• แสดงบัตรนักเรียน/นักศึกษา\n• ใช้ได้ทุกวัน\n• ไม่รวมโปรโมชันอื่น',
    couponCode: null,
    claimType: 'show_at_shop',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-12-31'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_003',
    shopId: 'shop_001',
    title: 'Weekend Coffee Set',
    category: 'monthly',
    description: 'เซตกาแฟวันเสาร์-อาทิตย์ กาแฟ 1 แก้ว + ขนม 1 ชิ้น ราคาพิเศษ ฿159',
    shortDescription: 'เซตกาแฟ + ขนม ฿159',
    discountText: '฿159 (ปกติ ฿220)',
    conditions: '• เฉพาะวันเสาร์-อาทิตย์\n• เลือกเครื่องดื่มเย็นได้\n• เลือกขนมจากเมนูที่ร่วมรายการ',
    couponCode: 'WEEKEND159',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-07-15'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_004',
    shopId: 'shop_001',
    title: 'Valentine Dessert Set',
    category: 'special_day',
    description: 'เซตวาเลนไทน์ ขนม 2 ชิ้น + เครื่องดื่ม 2 แก้ว ราคาพิเศษ ฿299',
    shortDescription: 'เซตวาเลนไทน์ ฿299',
    discountText: '฿299 (ปกติ ฿400)',
    conditions: '• เฉพาะวันที่ 14 กุมภาพันธ์\n• จำกัด 50 เซต',
    couponCode: 'VAL2025',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-02-14'),
    isActive: false,
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-14'),
  },
];

export const mockShop1Menu: MenuItem[] = [
  {
    id: 'menu_001',
    shopId: 'shop_001',
    name: 'Brownie',
    price: 89,
    description: 'บราวนี่ช็อกโกแลตเข้มข้น',
    imageUrl: null,
    sortOrder: 1,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'menu_002',
    shopId: 'shop_001',
    name: 'Matcha Latte',
    price: 120,
    description: 'มัทฉะลาเต้เย็น',
    imageUrl: null,
    sortOrder: 2,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'menu_003',
    shopId: 'shop_001',
    name: 'Berry Smoothie',
    price: 130,
    description: 'สมูทตี้เบอร์รี่รวม',
    imageUrl: null,
    sortOrder: 3,
    createdAt: new Date('2025-01-01'),
  },
];
```

### 5.2 Aroi Noodle House

```typescript
export const mockShop2: Shop = {
  id: 'shop_002',
  merchantId: 'merchant_002',
  slug: 'aroi-noodle-house',
  name: 'Aroi Noodle House',
  description: 'ร้านก๋วยเตี๋ยวเรือสูตรโบราณ ย่านเยาวราช',
  category: 'restaurant',
  coverImage: '/images/aroi-cover.jpg',
  logoImage: '/images/aroi-logo.jpg',
  address: '456 ถนนเยาวราช แขวงสัมพันธวงศ์ เขตสัมพันธวงศ์ กรุงเทพฯ 10100',
  latitude: 13.7399,
  longitude: 100.5089,
  phone: '089-876-5432',
  lineId: '@arooodle',
  facebookUrl: 'https://facebook.com/arooodle',
  instagramUrl: null,
  websiteUrl: null,
  openingHours: JSON.stringify({
    mon: '08:00-16:00',
    tue: '08:00-16:00',
    wed: '08:00-16:00',
    thu: '08:00-16:00',
    fri: '08:00-16:00',
    sat: '08:00-17:00',
    sun: '08:00-17:00',
  }),
  isOpen: true,
  tier: 'free',
  maxActiveDeals: 6,
  createdAt: new Date('2025-02-01'),
  updatedAt: new Date('2025-07-01'),
};

export const mockShop2Deals: Deal[] = [
  {
    id: 'deal_005',
    shopId: 'shop_002',
    title: 'Senior Lunch Deal',
    category: 'senior',
    description: 'ก๋วยเตี๋ยว 1 ชาม + น้ำ 1 แก้ว ราคาพิเศษ ฿69 สำหรับผู้สูงอายุ 60+',
    shortDescription: 'ก๋วยเตี๋ยว + น้ำ ฿69',
    discountText: '฿69 (ปกติ ฿100)',
    conditions: '• อายุ 60+ ปี\n• แสดงบัตรประชาชน\n• เฉพาะวันจันทร์-ศุกร์\n• เวลา 08:00-14:00',
    couponCode: null,
    claimType: 'show_at_shop',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-09-30'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_006',
    shopId: 'shop_002',
    title: 'Monthly Combo Deal',
    category: 'monthly',
    description: 'ก๋วยเตี๋ยว 2 ชาม + เกี๊ยวทอด 1 จาน + น้ำ 2 แก้ว ราคาพิเศษ ฿199',
    shortDescription: 'เซตคอมโบ ฿199',
    discountText: '฿199 (ปกติ ฿280)',
    conditions: '• ใช้ได้ทุกวัน\n• ไม่รวมโปรโมชันอื่น',
    couponCode: 'AROICOMBO',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-07-31'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_007',
    shopId: 'shop_002',
    title: 'Kids Eat Free Sunday',
    category: 'kids',
    description: 'เด็กอายุต่ำกว่า 12 ปี กินฟรี 1 ชาม เมื่อผู้ปกครองสั่ง 2 ชาม',
    shortDescription: 'เด็กกินฟรี วันอาทิตย์',
    discountText: 'ฟรี 1 ชาม',
    conditions: '• เฉพาะวันอาทิตย์\n• เด็กอายุต่ำกว่า 12 ปี\n• ผู้ปกครองสั่ง 2 ชามขึ้นไป',
    couponCode: null,
    claimType: 'show_at_shop',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-12-31'),
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-07-01'),
  },
];
```

### 5.3 Glow Hair Studio

```typescript
export const mockShop3: Shop = {
  id: 'shop_003',
  merchantId: 'merchant_003',
  slug: 'glow-hair-studio',
  name: 'Glow Hair Studio',
  description: 'ซาลอนสไตล์โมเดิร์น ย่านทองหล่อ',
  category: 'beauty',
  coverImage: '/images/glow-cover.jpg',
  logoImage: '/images/glow-logo.jpg',
  address: '789 ซอยทองหล่อ 10 แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพฯ 10110',
  latitude: 13.7307,
  longitude: 100.5867,
  phone: '092-345-6789',
  lineId: '@glowhairstudio',
  facebookUrl: 'https://facebook.com/glowhairstudio',
  instagramUrl: 'https://instagram.com/glowhairstudio',
  websiteUrl: 'https://glowhairstudio.com',
  openingHours: JSON.stringify({
    mon: '10:00-20:00',
    tue: '10:00-20:00',
    wed: '10:00-20:00',
    thu: '10:00-20:00',
    fri: '10:00-21:00',
    sat: '09:00-21:00',
    sun: '09:00-20:00',
  }),
  isOpen: true,
  tier: 'free',
  maxActiveDeals: 6,
  createdAt: new Date('2025-03-01'),
  updatedAt: new Date('2025-07-01'),
};

export const mockShop3Deals: Deal[] = [
  {
    id: 'deal_008',
    shopId: 'shop_003',
    title: 'First Visit 20% Off',
    category: 'custom',
    description: 'ลด 20% สำหรับลูกค้าใหม่ ทุกบริการ',
    shortDescription: 'ลูกค้าใหม่ ลด 20%',
    discountText: 'ลด 20%',
    conditions: '• สำหรับลูกค้าใหม่เท่านั้น\n• ใช้ได้ 1 ครั้ง\n• ทุกบริการ',
    couponCode: 'GLOW20NEW',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-12-31'),
    isActive: true,
    createdAt: new Date('2025-03-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_009',
    shopId: 'shop_003',
    title: 'Student Haircut Deal',
    category: 'student',
    description: 'ตัดผม ราคาพิเศษ ฿199 สำหรับนักเรียน/นักศึกษา',
    shortDescription: 'ตัดผมนักเรียน ฿199',
    discountText: '฿199 (ปกติ ฿350)',
    conditions: '• แสดงบัตรนักเรียน/นักศึกษา\n• ตัดผมเท่านั้น\n• ไม่รวมสระไดร์',
    couponCode: null,
    claimType: 'show_at_shop',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-10-31'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
  {
    id: 'deal_010',
    shopId: 'shop_003',
    title: "Mother's Day Package",
    category: 'special_day',
    description: 'แพ็กเกจวันแม่ สระ ตัด ไดร์ ทำสี ราคาพิเศษ ฿999',
    shortDescription: 'แพ็กเกจวันแม่ ฿999',
    discountText: '฿999 (ปกติ ฿1,500)',
    conditions: '• เฉพาะวันที่ 12 สิงหาคม\n• จองล่วงหน้า\n• จำกัด 20 คิว',
    couponCode: 'MOM2025',
    claimType: 'copy_code',
    imageUrl: null,
    startDate: null,
    endDate: new Date('2025-08-12'),
    isActive: true,
    createdAt: new Date('2025-07-01'),
    updatedAt: new Date('2025-07-01'),
  },
];
```

---

## 6. Computed Fields

### 6.1 Deal Status (computed at query time)

```typescript
export type DealStatus = 'active' | 'expiring_soon' | 'expired';

export function getDealStatus(deal: Deal): DealStatus {
  const now = new Date();
  const end = new Date(deal.endDate);
  const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (!deal.isActive || end < now) return 'expired';
  if (hoursLeft <= 24) return 'expiring_soon';
  return 'active';
}
```

### 6.2 Days Remaining

```typescript
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
```

---

## 7. Database File Location

```
dealdoor/
├── db/
│   ├── dev.db          ← SQLite database file
│   ├── schema.ts       ← Drizzle schema
│   └── seed.ts         ← Seed script
├── drizzle/
│   └── migrations/     ← Auto-generated migrations
└── drizzle.config.ts   ← Drizzle Kit config
```

---

## 8. Seed Strategy

1. Create 3 merchants
2. Create 3 shops with full info
3. Create deals with mixed states (active, expiring soon, expired)
4. Create menu items for Moon Bowl Cafe
5. Use Drizzle ORM insert API
6. Run via `npm run db:seed` script

---

## 9. Image Storage Strategy

### 9.1 Image Types & Requirements

| Type | Dimensions | Max Size | Format | DB Field |
|------|------------|----------|--------|----------|
| Shop cover | 1200×400px | 2MB | WebP, JPG | `shops.coverImage` |
| Shop logo | 200×200px | 500KB | WebP, PNG | `shops.logoImage` |
| Deal image | 800×600px | 1MB | WebP, JPG | `deals.imageUrl` |
| Menu item | 400×400px | 500KB | WebP, JPG | `menuItems.imageUrl` |

### 9.2 Storage Options Comparison

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Local filesystem** | Simple, no external deps | Lost on redeploy, no CDN | MVP |
| **Cloudflare R2** | S3-compatible, cheap, global CDN | Requires setup | Production |
| **AWS S3** | Mature, widely used | More expensive, complex | Enterprise |
| **Cloudinary** | Built-in transformations | Vendor lock-in, cost | Advanced imaging |
| **Uploadthing** | DX-focused, simple API | Less control | Quick setup |

### 9.3 MVP: Local Filesystem

```
public/
└── uploads/
    ├── shops/
    │   ├── covers/
    │   │   └── {shopId}-{hash}.webp
    │   └── logos/
    │       └── {shopId}-{hash}.webp
    ├── deals/
    │   └── {dealId}-{hash}.webp
    └── menu/
        └── {itemId}-{hash}.webp
```

**Implementation:**
```typescript
// Upload handler
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export async function uploadImage(file: File, type: string): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  
  const uploadDir = join(process.cwd(), 'public', 'uploads', type);
  await mkdir(uploadDir, { recursive: true });
  
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${type}/${filename}`;
}
```

### 9.4 Production: Cloudflare R2

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await R2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `https://${process.env.CF_DOMAIN}/${key}`;
}
```

### 9.5 Image Optimization

```typescript
import sharp from 'sharp';

export async function optimizeImage(buffer: Buffer, preset: string): Promise<Buffer> {
  const presets = {
    shopCover: { width: 1200, height: 400, quality: 80 },
    shopLogo: { width: 200, height: 200, quality: 85 },
    dealImage: { width: 800, height: 600, quality: 80 },
    menuItem: { width: 400, height: 400, quality: 80 },
  };

  const { width, height, quality } = presets[preset] || presets.dealImage;

  return sharp(buffer)
    .resize(width, height, { fit: 'cover', position: 'center' })
    .webp({ quality })
    .toBuffer();
}
```

### 9.6 Placeholder Images

```typescript
export function generatePlaceholder(text: string, size: number = 200): string {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFF0EB"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.3}" 
            fill="#FF6B35" text-anchor="middle" dy=".35em">${text.charAt(0)}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
```

### 9.7 Database Schema for Images

Images are stored as URL strings in the database:

```typescript
// In shops table
coverImage: text('cover_image'),     // URL or null
logoImage: text('logo_image'),       // URL or null

// In deals table
imageUrl: text('image_url'),         // URL or null

// In menuItems table
imageUrl: text('image_url'),         // URL or null
```

### 9.8 Migration Path

| Phase | Storage | CDN | Backup |
|-------|---------|-----|--------|
| MVP | Local filesystem | None | Git (if small) |
| Production | Cloudflare R2 | Cloudflare CDN | R2 versioning |
| Scale | Cloudflare R2 | Cloudflare CDN | Cross-region replication |
