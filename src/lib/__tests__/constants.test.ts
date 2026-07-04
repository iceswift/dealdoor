// src/lib/__tests__/constants.test.ts

import { describe, it, expect } from 'vitest';
import {
  SHOP_CATEGORIES,
  SHOP_CATEGORY_LABELS,
  SHOP_CATEGORY_ICONS,
  DEAL_CATEGORIES,
  DEAL_CATEGORY_LABELS,
  DEAL_CATEGORY_COLORS,
  CLAIM_TYPES,
  CLAIM_TYPE_LABELS,
  TIERS,
  TIER_LIMITS,
} from '../constants';

describe('Shop Categories', () => {
  it('has all categories', () => {
    expect(SHOP_CATEGORIES.length).toBeGreaterThan(0);
    expect(SHOP_CATEGORIES).toContain('restaurant');
    expect(SHOP_CATEGORIES).toContain('cafe');
    expect(SHOP_CATEGORIES).toContain('beauty');
  });

  it('has labels for all categories', () => {
    SHOP_CATEGORIES.forEach(cat => {
      expect(SHOP_CATEGORY_LABELS[cat]).toBeDefined();
      expect(SHOP_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    });
  });

  it('has icons for all categories', () => {
    SHOP_CATEGORIES.forEach(cat => {
      expect(SHOP_CATEGORY_ICONS[cat]).toBeDefined();
    });
  });
});

describe('Deal Categories', () => {
  it('has all categories', () => {
    expect(DEAL_CATEGORIES.length).toBeGreaterThan(0);
    expect(DEAL_CATEGORIES).toContain('birthday');
    expect(DEAL_CATEGORIES).toContain('student');
    expect(DEAL_CATEGORIES).toContain('flash');
  });

  it('has labels for all categories', () => {
    DEAL_CATEGORIES.forEach(cat => {
      expect(DEAL_CATEGORY_LABELS[cat]).toBeDefined();
      expect(DEAL_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    });
  });

  it('has colors for all categories', () => {
    DEAL_CATEGORIES.forEach(cat => {
      expect(DEAL_CATEGORY_COLORS[cat]).toBeDefined();
      expect(DEAL_CATEGORY_COLORS[cat]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});

describe('Claim Types', () => {
  it('has all types', () => {
    expect(CLAIM_TYPES.length).toBeGreaterThan(0);
    expect(CLAIM_TYPES).toContain('copy_code');
    expect(CLAIM_TYPES).toContain('show_at_shop');
  });

  it('has labels for all types', () => {
    CLAIM_TYPES.forEach(type => {
      expect(CLAIM_TYPE_LABELS[type]).toBeDefined();
    });
  });
});

describe('Tiers', () => {
  it('has free and pro tiers', () => {
    expect(TIERS).toContain('free');
    expect(TIERS).toContain('pro');
  });

  it('has limits for all tiers', () => {
    TIERS.forEach(tier => {
      expect(TIER_LIMITS[tier]).toBeDefined();
      expect(TIER_LIMITS[tier].maxDeals).toBeGreaterThan(0);
    });
  });

  it('free tier has 6 max deals', () => {
    expect(TIER_LIMITS.free.maxDeals).toBe(6);
  });
});
