import { and, desc, eq, gt, gte, inArray, lte, sql } from 'drizzle-orm';
import { db } from '../../lib/db';
import {
  boostCampaigns,
  boostCreditOrders,
  boostTransactions,
  boostWallets,
  deals,
  analyticsEvents,
  reports,
  shops,
  type Shop,
} from '../../lib/db-schema';
import { firstRow } from '../../lib/db-query';
import { badRequest, conflict, notFound } from '../../lib/errors';
import { BOOST_RULES, canStartBoost, getBoostCreditsForDuration, getBoostEntitlements, type Tier } from '../../lib/tiers';
import { BOOST_CREDIT_PACKAGES, getBoostCreditPackage } from '../../lib/boosts/catalog';

const ACTIVE_CAMPAIGN_STATUSES = ['scheduled', 'active'] as const;
const ALLOWED_DURATIONS = [24, 48, 72, 168] as const;

function cycleKey(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

async function ensureBoostWallet(shop: Shop, now = new Date()) {
  let wallet = await firstRow(db.select().from(boostWallets).where(eq(boostWallets.shopId, shop.id)).limit(1));
  if (!wallet) {
    await db.insert(boostWallets).values({ shopId: shop.id }).onConflictDoNothing();
    wallet = await firstRow(db.select().from(boostWallets).where(eq(boostWallets.shopId, shop.id)).limit(1));
  }
  if (!wallet) throw new Error('Unable to initialize Boost wallet');

  const entitlement = getBoostEntitlements((shop.tier as Tier) || 'free');
  if (entitlement.includedCreditsPerBillingCycle <= 0) return wallet;

  const grantKey = `boost-plan:${shop.id}:${cycleKey(now)}`;
  const grant = await firstRow(db
    .select({ id: boostTransactions.id })
    .from(boostTransactions)
    .where(eq(boostTransactions.idempotencyKey, grantKey))
    .limit(1));

  if (!grant) {
    const nextBalance = wallet.includedCreditsBalance + entitlement.includedCreditsPerBillingCycle;
    await db.transaction(async (tx: any) => {
      await tx.insert(boostTransactions).values({
        walletId: wallet!.id,
        shopId: shop.id,
        type: 'plan_grant',
        creditSource: 'included',
        creditDelta: entitlement.includedCreditsPerBillingCycle,
        balanceAfter: nextBalance,
        idempotencyKey: grantKey,
        metadata: JSON.stringify({ cycle: cycleKey(now) }),
      });
      await tx.update(boostWallets)
        .set({ includedCreditsBalance: nextBalance, updatedAt: now })
        .where(eq(boostWallets.id, wallet!.id));
    });
    wallet = await firstRow(db.select().from(boostWallets).where(eq(boostWallets.id, wallet.id)).limit(1));
  }

  if (!wallet) throw new Error('Boost wallet disappeared');
  return wallet;
}

export async function getBoostDashboard(shop: Shop) {
  const now = new Date();
  const wallet = await ensureBoostWallet(shop, now);
  const entitlement = getBoostEntitlements((shop.tier as Tier) || 'free');
  const [eligibleDeals, campaigns, orders, analytics] = await Promise.all([
    db.select().from(deals).where(and(eq(deals.shopId, shop.id), eq(deals.isActive, true), gt(deals.endDate, now))).orderBy(desc(deals.createdAt)),
    db.select({ campaign: boostCampaigns, deal: deals })
      .from(boostCampaigns)
      .leftJoin(deals, eq(boostCampaigns.dealId, deals.id))
      .where(eq(boostCampaigns.shopId, shop.id))
      .orderBy(desc(boostCampaigns.createdAt))
      .limit(20),
    db.select().from(boostCreditOrders)
      .where(eq(boostCreditOrders.shopId, shop.id))
      .orderBy(desc(boostCreditOrders.createdAt))
      .limit(10),
    getBoostAnalytics(shop.id),
  ]);

  return {
    wallet: {
      includedCredits: wallet.includedCreditsBalance,
      purchasedCredits: wallet.purchasedCreditsBalance,
      availableCredits: wallet.includedCreditsBalance + wallet.purchasedCreditsBalance,
    },
    entitlement,
    rules: {
      creditDurationHours: BOOST_RULES.creditDurationHours,
      maxCampaignDurationHours: BOOST_RULES.maxCampaignDurationHours,
      purchasedCreditExpiryDays: BOOST_RULES.purchasedCreditExpiryDays,
      durations: ALLOWED_DURATIONS,
    },
    eligibleDeals,
    campaigns,
    orders,
    creditPackages: BOOST_CREDIT_PACKAGES,
    analytics,
  };
}

export async function getBoostAnalytics(shopId: string, days = 30) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const rows = await db.select({
    campaignId: boostCampaigns.id,
    dealId: boostCampaigns.dealId,
    dealTitle: deals.title,
    status: boostCampaigns.status,
    startsAt: boostCampaigns.startsAt,
    endsAt: boostCampaigns.endsAt,
    creditsReserved: boostCampaigns.creditsReserved,
    impressions: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_impression' then 1 else 0 end)`,
    views: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_view' then 1 else 0 end)`,
    clicks: sql<number>`sum(case when ${analyticsEvents.type} = 'deal_click' then 1 else 0 end)`,
    claims: sql<number>`sum(case when ${analyticsEvents.type} = 'claim_started' then 1 else 0 end)`,
    couponCopies: sql<number>`sum(case when ${analyticsEvents.type} = 'coupon_copied' then 1 else 0 end)`,
  })
    .from(boostCampaigns)
    .leftJoin(deals, eq(boostCampaigns.dealId, deals.id))
    .leftJoin(analyticsEvents, and(
      eq(analyticsEvents.dealId, boostCampaigns.dealId),
      gte(analyticsEvents.createdAt, boostCampaigns.startsAt),
      lte(analyticsEvents.createdAt, boostCampaigns.endsAt)
    ))
    .where(and(eq(boostCampaigns.shopId, shopId), gte(boostCampaigns.endsAt, cutoff)))
    .groupBy(
      boostCampaigns.id,
      boostCampaigns.dealId,
      deals.title,
      boostCampaigns.status,
      boostCampaigns.startsAt,
      boostCampaigns.endsAt,
      boostCampaigns.creditsReserved
    )
    .orderBy(desc(boostCampaigns.startsAt))
    .limit(20);

  const campaigns = rows.map((row) => ({
    ...row,
    impressions: Number(row.impressions) || 0,
    views: Number(row.views) || 0,
    clicks: Number(row.clicks) || 0,
    claims: Number(row.claims) || 0,
    couponCopies: Number(row.couponCopies) || 0,
  }));
  const totals = campaigns.reduce((total, campaign) => ({
    impressions: total.impressions + campaign.impressions,
    views: total.views + campaign.views,
    clicks: total.clicks + campaign.clicks,
    claims: total.claims + campaign.claims,
    couponCopies: total.couponCopies + campaign.couponCopies,
  }), { impressions: 0, views: 0, clicks: 0, claims: 0, couponCopies: 0 });

  return {
    days,
    campaigns,
    totals: {
      ...totals,
      clickThroughRate: totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 1000) / 10 : null,
      claimRate: totals.clicks > 0 ? Math.round((totals.claims / totals.clicks) * 1000) / 10 : null,
    },
  };
}

export async function createBoostCreditOrder(shop: Shop, input: unknown) {
  const packageId = String((input as { packageId?: string })?.packageId || '');
  const selectedPackage = getBoostCreditPackage(packageId);
  if (!selectedPackage) throw badRequest('INVALID_BOOST_PACKAGE', 'Boost credit package not found.');

  const entitlement = getBoostEntitlements((shop.tier as Tier) || 'free');
  if (!entitlement.canPurchaseCredits) throw conflict('BOOST_PURCHASE_NOT_ALLOWED', 'Your current plan cannot purchase Boost credits.');

  const [order] = await db.insert(boostCreditOrders).values({
    shopId: shop.id,
    status: 'pending',
    currency: selectedPackage.currency,
    amountMinor: selectedPackage.amountMinor,
    creditQuantity: selectedPackage.credits,
    metadata: JSON.stringify({ packageId: selectedPackage.id, packageName: selectedPackage.name }),
  }).returning();

  return { order, package: selectedPackage, paymentStatus: 'provider_not_configured' as const };
}

// Reserved for the payment webhook adapter. Do not expose this to a browser route.
export async function confirmBoostCreditOrderPaid(orderId: string, provider: string, providerReference: string) {
  const now = new Date();
  return db.transaction(async (tx: any) => {
    const order = await firstRow(tx.select().from(boostCreditOrders).where(eq(boostCreditOrders.id, orderId)).limit(1));
    if (!order) throw notFound('Boost credit order not found.');
    if (order.status === 'paid') return order;
    if (order.status !== 'pending') throw conflict('BOOST_ORDER_NOT_PAYABLE', 'This Boost credit order cannot be paid.');

    let wallet = await firstRow(tx.select().from(boostWallets).where(eq(boostWallets.shopId, order.shopId)).limit(1));
    if (!wallet) {
      await tx.insert(boostWallets).values({ shopId: order.shopId });
      wallet = await firstRow(tx.select().from(boostWallets).where(eq(boostWallets.shopId, order.shopId)).limit(1));
    }
    if (!wallet) throw new Error('Unable to initialize Boost wallet');

    const nextPurchased = wallet.purchasedCreditsBalance + order.creditQuantity;
    const [paidOrder] = await tx.update(boostCreditOrders)
      .set({ status: 'paid', provider, providerReference, paidAt: now, updatedAt: now })
      .where(and(eq(boostCreditOrders.id, order.id), eq(boostCreditOrders.status, 'pending')))
      .returning();
    if (!paidOrder) return order;

    await tx.insert(boostTransactions).values({
      walletId: wallet.id,
      shopId: order.shopId,
      orderId: order.id,
      type: 'purchase',
      creditSource: 'purchased',
      creditDelta: order.creditQuantity,
      balanceAfter: nextPurchased,
      idempotencyKey: `boost-purchase:${order.id}`,
      expiresAt: new Date(now.getTime() + BOOST_RULES.purchasedCreditExpiryDays * 24 * 60 * 60 * 1000),
      metadata: JSON.stringify({ provider, providerReference }),
    });
    await tx.update(boostWallets).set({ purchasedCreditsBalance: nextPurchased, updatedAt: now }).where(eq(boostWallets.id, wallet.id));
    return paidOrder;
  });
}

export async function startBoostCampaign(shop: Shop, userId: string, input: unknown) {
  const payload = input as { dealId?: string; durationHours?: number };
  const dealId = String(payload?.dealId || '');
  const durationHours = Number(payload?.durationHours);
  if (!dealId || !ALLOWED_DURATIONS.includes(durationHours as typeof ALLOWED_DURATIONS[number])) {
    throw badRequest('INVALID_BOOST_REQUEST', 'เลือกดีลและระยะเวลา Boost ที่รองรับ');
  }

  const now = new Date();
  await ensureBoostWallet(shop, now);
  const result = await db.transaction(async (tx: any) => {
    const deal = await firstRow(tx.select().from(deals).where(and(eq(deals.id, dealId), eq(deals.shopId, shop.id))).limit(1));
    if (!deal) throw notFound('ไม่พบดีลของร้านค้านี้');
    if (!deal.isActive || new Date(deal.endDate) <= now) throw conflict('INELIGIBLE_DEAL', 'ดีลนี้ไม่พร้อมสำหรับการ Boost');

    const activeCampaigns = await tx.select({ id: boostCampaigns.id })
      .from(boostCampaigns)
      .where(and(eq(boostCampaigns.shopId, shop.id), inArray(boostCampaigns.status, [...ACTIVE_CAMPAIGN_STATUSES]), gt(boostCampaigns.endsAt, now)))
      .limit(10);
    if (!canStartBoost(activeCampaigns.length, (shop.tier as Tier) || 'free')) {
      throw conflict('BOOST_CONCURRENCY_LIMIT', 'คุณใช้จำนวนดีล Boost พร้อมกันครบตามสิทธิ์แล้ว');
    }

    const duplicate = await firstRow(tx.select({ id: boostCampaigns.id })
      .from(boostCampaigns)
      .where(and(eq(boostCampaigns.dealId, deal.id), inArray(boostCampaigns.status, [...ACTIVE_CAMPAIGN_STATUSES]), gt(boostCampaigns.endsAt, now)))
      .limit(1));
    if (duplicate) throw conflict('DEAL_ALREADY_BOOSTED', 'ดีลนี้กำลังถูก Boost อยู่แล้ว');

    let wallet = await firstRow(tx.select().from(boostWallets).where(eq(boostWallets.shopId, shop.id)).limit(1));
    if (!wallet) throw conflict('BOOST_WALLET_UNAVAILABLE', 'ยังไม่พบกระเป๋าเครดิต Boost กรุณารีเฟรชหน้าแล้วลองใหม่');

    const creditsRequired = getBoostCreditsForDuration(durationHours);
    const available = wallet.includedCreditsBalance + wallet.purchasedCreditsBalance;
    if (available < creditsRequired) throw conflict('INSUFFICIENT_BOOST_CREDITS', 'เครดิต Boost ไม่เพียงพอ');

    const useIncluded = Math.min(wallet.includedCreditsBalance, creditsRequired);
    const usePurchased = creditsRequired - useIncluded;
    const creditSource = useIncluded && usePurchased ? 'mixed' : useIncluded ? 'included' : 'purchased';
    const [campaign] = await tx.insert(boostCampaigns).values({
      shopId: shop.id,
      dealId: deal.id,
      createdByUserId: userId,
      status: 'active',
      creditSource,
      creditsReserved: creditsRequired,
      startsAt: now,
      endsAt: new Date(now.getTime() + durationHours * 60 * 60 * 1000),
    }).returning();

    const nextIncluded = wallet.includedCreditsBalance - useIncluded;
    const nextPurchased = wallet.purchasedCreditsBalance - usePurchased;
    if (useIncluded) {
      await tx.insert(boostTransactions).values({
        walletId: wallet.id, shopId: shop.id, campaignId: campaign.id,
        type: 'campaign_charge', creditSource: 'included', creditDelta: -useIncluded,
        balanceAfter: nextIncluded,
      });
    }
    if (usePurchased) {
      await tx.insert(boostTransactions).values({
        walletId: wallet.id, shopId: shop.id, campaignId: campaign.id,
        type: 'campaign_charge', creditSource: 'purchased', creditDelta: -usePurchased,
        balanceAfter: nextPurchased,
      });
    }
    await tx.update(boostWallets)
      .set({ includedCreditsBalance: nextIncluded, purchasedCreditsBalance: nextPurchased, updatedAt: now })
      .where(eq(boostWallets.id, wallet.id));
    return campaign;
  });

  return result;
}

export async function stopBoostCampaign(shop: Shop, campaignId: string) {
  const now = new Date();
  const campaign = await firstRow(db.select().from(boostCampaigns)
    .where(and(eq(boostCampaigns.id, campaignId), eq(boostCampaigns.shopId, shop.id)))
    .limit(1));
  if (!campaign) throw notFound('Boost campaign not found.');
  if (!ACTIVE_CAMPAIGN_STATUSES.includes(campaign.status as typeof ACTIVE_CAMPAIGN_STATUSES[number]) || campaign.endsAt <= now) {
    throw conflict('BOOST_NOT_ACTIVE', 'This Boost campaign is no longer active.');
  }
  await db.update(boostCampaigns)
    .set({ status: 'stopped', stoppedAt: now, stopReason: 'merchant_stopped', updatedAt: now })
    .where(eq(boostCampaigns.id, campaign.id));
}

export async function getAdminBoostQueue() {
  const now = new Date();
  const [campaignRows, pendingReports] = await Promise.all([
    db.select({ campaign: boostCampaigns, deal: deals, shop: shops })
      .from(boostCampaigns)
      .leftJoin(deals, eq(boostCampaigns.dealId, deals.id))
      .leftJoin(shops, eq(boostCampaigns.shopId, shops.id))
      .where(inArray(boostCampaigns.status, [...ACTIVE_CAMPAIGN_STATUSES]))
      .orderBy(desc(boostCampaigns.createdAt))
      .limit(100),
    db.select({ targetId: reports.targetId, targetType: reports.targetType, count: sql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, 'pending'))
      .groupBy(reports.targetId, reports.targetType),
  ]);

  const reportCounts = new Map(pendingReports.map((row) => [`${row.targetType}:${row.targetId}`, Number(row.count) || 0]));
  return campaignRows.map(({ campaign, deal, shop }) => {
    const pendingReportCount = (reportCounts.get(`deal:${campaign.dealId}`) || 0)
      + (reportCounts.get(`shop:${campaign.shopId}`) || 0);
    const flags: string[] = [];
    if (!deal) flags.push('deal_missing');
    if (deal && !deal.isActive) flags.push('deal_inactive');
    if (deal && deal.endDate <= now) flags.push('deal_expired');
    if (deal && campaign.endsAt > deal.endDate) flags.push('campaign_outlives_deal');
    if (pendingReportCount > 0) flags.push('pending_reports');
    return { campaign, deal, shop, pendingReportCount, flags };
  });
}

export async function stopBoostCampaignByAdmin(campaignId: string, reason: string) {
  const now = new Date();
  const campaign = await firstRow(db.select().from(boostCampaigns).where(eq(boostCampaigns.id, campaignId)).limit(1));
  if (!campaign) throw notFound('Boost campaign not found.');
  if (!ACTIVE_CAMPAIGN_STATUSES.includes(campaign.status as typeof ACTIVE_CAMPAIGN_STATUSES[number]) || campaign.endsAt <= now) {
    throw conflict('BOOST_NOT_ACTIVE', 'This Boost campaign is no longer active.');
  }
  const safeReason = reason.trim().slice(0, 240) || 'admin_moderation';
  await db.update(boostCampaigns)
    .set({ status: 'stopped', stoppedAt: now, stopReason: `admin:${safeReason}`, updatedAt: now })
    .where(eq(boostCampaigns.id, campaign.id));
  return campaign;
}
