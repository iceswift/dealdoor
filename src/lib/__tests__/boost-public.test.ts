import { describe, expect, it } from 'vitest';
import { prioritizePromotedDeals } from '../boosts/public';

const makeDeal = (id: string) => ({ deal: { id } });

describe('public Boost ranking', () => {
  it('moves only the allowed number of eligible promoted deals to the front', () => {
    const deals = [makeDeal('normal-a'), makeDeal('boost-a'), makeDeal('boost-b'), makeDeal('normal-b')];
    const ranked = prioritizePromotedDeals(deals, new Set(['boost-a', 'boost-b']), 1);

    expect(ranked.map((item) => item.deal.id)).toEqual(['boost-a', 'normal-a', 'boost-b', 'normal-b']);
  });

  it('keeps the natural order when there is no eligible promoted deal', () => {
    const deals = [makeDeal('normal-a'), makeDeal('normal-b')];
    expect(prioritizePromotedDeals(deals, new Set(['boost-a']), 1)).toEqual(deals);
  });
});
