import { describe, expect, it } from 'vitest';
import {
  BOOST_RULES,
  canStartBoost,
  getBoostCreditsForDuration,
  getBoostEntitlements,
} from '../tiers';

describe('Boost tier rules', () => {
  it('keeps included credits and concurrency explicit per tier', () => {
    expect(getBoostEntitlements('free')).toMatchObject({
      includedCreditsPerBillingCycle: 0,
      maxConcurrentCampaigns: 1,
      canPurchaseCredits: true,
    });
    expect(getBoostEntitlements('pro')).toMatchObject({
      includedCreditsPerBillingCycle: 4,
      maxConcurrentCampaigns: 2,
      canPurchaseCredits: true,
    });
  });

  it('calculates 24-hour credits without undercharging partial days', () => {
    expect(getBoostCreditsForDuration(1)).toBe(1);
    expect(getBoostCreditsForDuration(BOOST_RULES.creditDurationHours)).toBe(1);
    expect(getBoostCreditsForDuration(BOOST_RULES.creditDurationHours + 1)).toBe(2);
  });

  it('prevents campaigns above the plan concurrency limit', () => {
    expect(canStartBoost(0, 'free')).toBe(true);
    expect(canStartBoost(1, 'free')).toBe(false);
    expect(canStartBoost(1, 'pro')).toBe(true);
    expect(canStartBoost(2, 'pro')).toBe(false);
  });
});
