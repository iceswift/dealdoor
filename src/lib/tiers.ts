// src/lib/tiers.ts

// ─── Tier Definitions ────────────────────────────────────

export type Tier = 'free' | 'pro';

export interface BoostEntitlements {
  includedCreditsPerBillingCycle: number;
  maxConcurrentCampaigns: number;
  canPurchaseCredits: boolean;
}

export interface TierLimits {
  maxShops: number;
  maxActiveDeals: number;
  maxMenuItems: number;
  hasQrCode: boolean;
  hasAnalytics: boolean;
  hasCustomBranding: boolean;
  hasScheduledDeals: boolean;
  hasMultipleBranches: boolean;
  hasPrioritySupport: boolean;
  boost: BoostEntitlements;
}

export const BOOST_RULES = {
  creditDurationHours: 24,
  maxCampaignDurationHours: 168,
  includedCreditsExpireAtBillingCycleEnd: true,
  purchasedCreditExpiryDays: 180,
} as const;

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxShops: 1,
    maxActiveDeals: 6,
    maxMenuItems: 10,
    hasQrCode: true,
    hasAnalytics: false,
    hasCustomBranding: false,
    hasScheduledDeals: false,
    hasMultipleBranches: false,
    hasPrioritySupport: false,
    boost: {
      includedCreditsPerBillingCycle: 0,
      maxConcurrentCampaigns: 1,
      canPurchaseCredits: true,
    },
  },
  pro: {
    maxShops: 1,
    maxActiveDeals: 100,
    maxMenuItems: 100,
    hasQrCode: true,
    hasAnalytics: true,
    hasCustomBranding: true,
    hasScheduledDeals: true,
    hasMultipleBranches: false, // Future: separate plan
    hasPrioritySupport: true,
    boost: {
      includedCreditsPerBillingCycle: 4,
      maxConcurrentCampaigns: 2,
      canPurchaseCredits: true,
    },
  },
};

// ─── Pricing ─────────────────────────────────────────────

export interface PricingPlan {
  id: Tier;
  name: string;
  nameTh: string;
  price: number; // THB
  priceMonthly: number;
  features: string[];
  featuresTh: string[];
  isPopular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    nameTh: 'ฟรี',
    price: 0,
    priceMonthly: 0,
    features: [
      '1 shop page',
      '6 active deals',
      '10 menu items',
      'QR code',
      'Share link',
      'Basic support',
      'Buy Boost credits when available',
    ],
    featuresTh: [
      '1 หน้าร้าน',
      '6 ดีลพร้อมกัน',
      '10 รายการเมนู',
      'QR Code',
      'ลิงก์แชร์',
      'การสนับสนุนพื้นฐาน',
      'ซื้อเครดิต Boost เพิ่มได้ (เร็ว ๆ นี้)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    nameTh: 'โปร',
    price: 299,
    priceMonthly: 299,
    features: [
      '1 shop page',
      '100 active deals',
      '100 menu items',
      'QR code download',
      'Analytics dashboard',
      'Custom branding',
      'Scheduled deals',
      'Priority support',
      '4 Boost credits per billing cycle',
      'Boost up to 2 deals at once',
    ],
    featuresTh: [
      '1 หน้าร้าน',
      '100 ดีลพร้อมกัน',
      '100 รายการเมนู',
      'ดาวน์โหลด QR Code',
      'แดชบอร์ดวิเคราะห์',
      'ปรับแต่งแบรนด์',
      'ตั้งเวลาดีล',
      'การสนับสนุนลำดับแรก',
      '4 เครดิต Boost ต่อรอบบิล',
      'Boost พร้อมกันได้สูงสุด 2 ดีล',
    ],
    isPopular: true,
  },
];

// ─── Tier Helpers ────────────────────────────────────────

export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

export function canCreateDeal(currentDeals: number, tier: Tier): boolean {
  const limits = getTierLimits(tier);
  return currentDeals < limits.maxActiveDeals;
}

export function canCreateMenuItem(currentItems: number, tier: Tier): boolean {
  const limits = getTierLimits(tier);
  return currentItems < limits.maxMenuItems;
}

export function hasFeature(tier: Tier, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(tier);
  return limits[feature] === true;
}

export function getRemainingDeals(currentDeals: number, tier: Tier): number {
  const limits = getTierLimits(tier);
  return Math.max(0, limits.maxActiveDeals - currentDeals);
}

export function getBoostEntitlements(tier: Tier): BoostEntitlements {
  return getTierLimits(tier).boost;
}

export function canStartBoost(currentCampaigns: number, tier: Tier): boolean {
  return currentCampaigns < getBoostEntitlements(tier).maxConcurrentCampaigns;
}

export function getBoostCreditsForDuration(durationHours: number): number {
  const normalizedHours = Math.max(0, durationHours);
  return Math.ceil(normalizedHours / BOOST_RULES.creditDurationHours);
}

// ─── Upgrade Prompt Messages ─────────────────────────────

export function getUpgradePrompt(context: string): {
  title: string;
  message: string;
  cta: string;
} {
  const prompts: Record<string, { title: string; message: string; cta: string }> = {
    deal_limit: {
      title: 'ใช้ดีลครบแล้ว',
      message: 'อัปเกรดเป็น Pro เพื่อเพิ่มดีลได้ไม่จำกัด',
      cta: 'อัปเกรดเป็น Pro',
    },
    analytics: {
      title: 'ดูสถิติการเข้าชม',
      message: 'อัปเกรดเป็น Pro เพื่อดูวิเคราะห์และสถิติ',
      cta: 'อัปเกรดเป็น Pro',
    },
    branding: {
      title: 'ปรับแต่งแบรนด์',
      message: 'อัปเกรดเป็น Pro เพื่อลบลายน้ำ DealDoor',
      cta: 'อัปเกรดเป็น Pro',
    },
    scheduled: {
      title: 'ตั้งเวลาดีล',
      message: 'อัปเกรดเป็น Pro เพื่อตั้งเวลาเผยแพร่ดีล',
      cta: 'อัปเกรดเป็น Pro',
    },
  };

  return prompts[context] || prompts.deal_limit;
}
