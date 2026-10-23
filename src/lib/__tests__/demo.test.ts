import { describe, expect, it } from 'vitest';
import { getDemoPolicy, isDemoAdminWriteBlocked } from '../demo';

describe('demo feature policy', () => {
  it('defaults to blocking registration and uploads only in demo mode', () => {
    expect(getDemoPolicy({ DEMO_MODE: 'true' })).toEqual({ registrationAllowed: false, uploadsAllowed: false });
    expect(getDemoPolicy({})).toEqual({ registrationAllowed: true, uploadsAllowed: true });
  });
  it('allows explicit independent opt-ins for private testing', () => {
    expect(getDemoPolicy({ DEMO_MODE: 'true', DEMO_ALLOW_UPLOADS: 'true' }))
      .toEqual({ registrationAllowed: false, uploadsAllowed: true });
    expect(getDemoPolicy({ DEMO_MODE: 'true', DEMO_ALLOW_REGISTRATION: 'true' }))
      .toEqual({ registrationAllowed: true, uploadsAllowed: false });
  });
  it('does not let demo switches disable production features', () => {
    expect(getDemoPolicy({ DEMO_MODE: 'false', DEMO_ALLOW_UPLOADS: 'false', DEMO_ALLOW_REGISTRATION: 'false' }))
      .toEqual({ registrationAllowed: true, uploadsAllowed: true });
  });
});

describe('public demo admin permissions', () => {
  it('blocks destructive and modifying admin requests in the demo', () => {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      expect(isDemoAdminWriteBlocked(true, 'admin', method, '/api/admin/boosts/campaign')).toBe(true);
    }
  });
  it('allows reading, signing out, and normal merchant operations', () => {
    expect(isDemoAdminWriteBlocked(true, 'admin', 'GET', '/api/reports')).toBe(false);
    expect(isDemoAdminWriteBlocked(true, 'admin', 'POST', '/api/auth/logout')).toBe(false);
    expect(isDemoAdminWriteBlocked(true, 'merchant', 'PATCH', '/api/shops/shop')).toBe(false);
  });
  it('does not change permissions outside the demo environment', () => {
    expect(isDemoAdminWriteBlocked(false, 'admin', 'DELETE', '/api/deals/deal')).toBe(false);
  });
});
