import { and, eq, gt, lte } from 'drizzle-orm';
import { db } from '../db';
import { boostCampaigns } from '../db-schema';

type DealEntry = { deal: { id: string } };

export async function getActiveBoostedDealIds(now = new Date()): Promise<Set<string>> {
  const rows = await db
    .select({ dealId: boostCampaigns.dealId })
    .from(boostCampaigns)
    .where(and(
      eq(boostCampaigns.status, 'active'),
      lte(boostCampaigns.startsAt, now),
      gt(boostCampaigns.endsAt, now),
    ));

  return new Set(rows.map((row) => row.dealId));
}

export function prioritizePromotedDeals<T extends DealEntry>(
  deals: T[],
  promotedDealIds: ReadonlySet<string>,
  maxPlacements = 1,
): T[] {
  if (maxPlacements <= 0 || promotedDealIds.size === 0) return [...deals];

  const selectedIds = new Set(
    deals
      .filter((item) => promotedDealIds.has(item.deal.id))
      .slice(0, maxPlacements)
      .map((item) => item.deal.id),
  );

  if (selectedIds.size === 0) return [...deals];
  return [
    ...deals.filter((item) => selectedIds.has(item.deal.id)),
    ...deals.filter((item) => !selectedIds.has(item.deal.id)),
  ];
}
