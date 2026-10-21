import { describe, expect, it } from 'vitest';
import { normalizeDealQuotaAnalytics, normalizeTrackEventInput } from '../services/analytics.service';
import { getDealQuotaAlert } from '../services/notification.service';
import { dealSchema } from '../../lib/validations';

describe('analytics event contract', () => {
  const request = new Request('https://dealdoor.test/api/analytics/track', {
    headers: {
      'user-agent': 'vitest',
      'x-real-ip': '127.0.0.1',
    },
  });

  it.each(['claim_started', 'coupon_copied', 'contact_started', 'redemption_confirmed'] as const)(
    'accepts the %s conversion event',
    (type) => {
      const event = normalizeTrackEventInput({
        type,
        shopId: 'shop_1',
        dealId: 'deal_1',
        metadata: { source: 'deal_detail', ignored: { nested: true } },
      }, request);

      expect(event).toMatchObject({
        type,
        shopId: 'shop_1',
        dealId: 'deal_1',
        metadata: { source: 'deal_detail' },
      });
    }
  );

  it('rejects unknown conversion events', () => {
    expect(() => normalizeTrackEventInput({ type: 'redeemed', shopId: 'shop_1' }, request)).toThrow();
  });

  it('accepts a promoted-card impression with simple attribution metadata', () => {
    const event = normalizeTrackEventInput({
      type: 'deal_impression',
      shopId: 'shop_1',
      dealId: 'deal_1',
      metadata: { placement: 'boost', surface: '/explore', unsafe: { nested: true } },
    }, request);

    expect(event).toMatchObject({
      type: 'deal_impression',
      metadata: { placement: 'boost', surface: '/explore' },
    });
  });

  it('keeps unlimited deals out of quota capacity and calculates limited deal status', () => {
    const quota = normalizeDealQuotaAnalytics([
      { dealId: 'limited', title: 'Limited deal', maxRedemptions: 20, lowStockThreshold: 5, redemptions: 16 },
      { dealId: 'sold-out', title: 'Sold out deal', maxRedemptions: 10, lowStockThreshold: 3, redemptions: 10 },
      { dealId: 'open', title: 'Open deal', maxRedemptions: null, lowStockThreshold: 10, redemptions: 99 },
    ]);

    expect(quota.summary).toMatchObject({
      limitedDealCount: 2,
      unlimitedDealCount: 1,
      limitedCapacity: 30,
      redeemedCapacity: 26,
      remainingCapacity: 4,
      fillRate: 87,
      lowStockDealCount: 1,
      exhaustedDealCount: 1,
    });
    expect(quota.deals.map((deal) => deal.status)).toEqual(['low_stock', 'exhausted', 'unlimited']);
    expect(quota.deals[2].fillRate).toBeNull();
  });

  it('rejects a redemption quota of zero', () => {
    const result = dealSchema.safeParse({
      title: 'Quota deal',
      category: 'custom',
      discountText: '10% off',
      claimType: 'show_at_shop',
      endDate: '2099-01-01',
      maxRedemptions: 0,
    });

    expect(result.success).toBe(false);
  });

  it('creates one semantic alert state for low, reached, and unlimited quotas', () => {
    expect(getDealQuotaAlert({
      dealId: 'low', title: 'Low deal', maxRedemptions: 20, lowStockThreshold: 5, redemptions: 16,
    })?.type).toBe('deal_quota_low');
    expect(getDealQuotaAlert({
      dealId: 'full', title: 'Full deal', maxRedemptions: 20, lowStockThreshold: 5, redemptions: 20,
    })?.type).toBe('deal_quota_reached');
    expect(getDealQuotaAlert({
      dealId: 'open', title: 'Open deal', maxRedemptions: null, lowStockThreshold: 5, redemptions: 20,
    })).toBeNull();
  });
});
