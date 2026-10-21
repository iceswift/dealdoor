import { describe, expect, it } from 'vitest';
import { isDemoAdminWriteBlocked } from '../demo';

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
