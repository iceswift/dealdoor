import { describe, expect, it, vi, afterEach } from 'vitest';
import { getSiteOrigin } from '../site';
import { getShareUrl } from '../utils';
import { getAbsoluteDealUrl } from '../deals/urls';
import { generateLocalBusinessSchema, generateOfferSchema } from '../seo';

afterEach(() => vi.unstubAllEnvs());

describe('deployment origin', () => {
  it('normalizes origins and rejects paths or credentials', () => {
    expect(getSiteOrigin('https://dealdoor.suwiwat.com/')).toBe('https://dealdoor.suwiwat.com');
    for (const url of ['ftp://example.com', 'https://user:pass@example.com', 'https://example.com/path', 'https://example.com?x=1']) {
      expect(() => getSiteOrigin(url)).toThrow();
    }
  });
  it('uses PUBLIC_SITE_URL consistently for share and structured-data defaults', () => {
    vi.stubEnv('PUBLIC_SITE_URL', 'https://dealdoor.suwiwat.com');
    const shop = { slug: 'moon-bowl-cafe' } as any;
    const deal = { id: 'a/b', endDate: new Date('2030-01-01') } as any;
    expect(getShareUrl(shop.slug)).toBe('https://dealdoor.suwiwat.com/moon-bowl-cafe');
    expect(getAbsoluteDealUrl(shop, deal)).toBe('https://dealdoor.suwiwat.com/deal/a%2Fb');
    expect(generateLocalBusinessSchema(shop)).toMatchObject({ url: 'https://dealdoor.suwiwat.com/moon-bowl-cafe' });
    expect(generateOfferSchema(deal, shop)).toMatchObject({ seller: { url: 'https://dealdoor.suwiwat.com/moon-bowl-cafe' } });
  });
});
