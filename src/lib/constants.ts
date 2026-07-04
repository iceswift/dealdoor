// src/lib/constants.ts

// ─── Shop Categories ─────────────────────────────────────

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

export type ShopCategory = typeof SHOP_CATEGORIES[number];

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

export const SHOP_CATEGORY_ICONS: Record<ShopCategory, string> = {
  restaurant: '🍜',
  cafe: '☕',
  dessert: '🍰',
  beauty: '💇',
  clinic: '🏥',
  retail: '🛍️',
  service: '🔧',
  other: '📦',
};

// ─── Deal Categories ─────────────────────────────────────

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

export type DealCategory = typeof DEAL_CATEGORIES[number];

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

// ─── Claim Types ─────────────────────────────────────────

export const CLAIM_TYPES = [
  'copy_code',
  'show_at_shop',
  'contact_shop',
  'open_line',
] as const;

export type ClaimType = typeof CLAIM_TYPES[number];

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  copy_code: 'คัดลอกโค้ด',
  show_at_shop: 'แสดงที่ร้าน',
  contact_shop: 'ติดต่อร้าน',
  open_line: 'เปิด LINE',
};

// ─── Tiers ───────────────────────────────────────────────

export const TIERS = ['free', 'pro'] as const;

export type Tier = typeof TIERS[number];

export const TIER_LIMITS: Record<Tier, { maxDeals: number }> = {
  free: { maxDeals: 6 },
  pro: { maxDeals: 100 },
};
