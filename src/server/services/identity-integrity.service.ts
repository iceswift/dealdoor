import { db } from '../../lib/db';
import { merchants, shops, users } from '../../lib/db-schema';

export type IdentityIntegrityReport = {
  totals: { users: number; merchants: number; shops: number; claimedMerchants: number; unclaimedMerchants: number };
  violations: {
    merchantWithoutUser: Array<{ merchantId: string; email: string }>;
    shopWithoutMerchant: Array<{ shopId: string; slug: string }>;
    duplicateMerchantUser: Array<{ userId: string; merchantIds: string[] }>;
  };
  unclaimedShops: Array<{ shopId: string; slug: string; name: string; merchantEmail: string }>;
  healthy: boolean;
};

export async function getIdentityIntegrityReport(): Promise<IdentityIntegrityReport> {
  const [userRows, merchantRows, shopRows] = await Promise.all([
    db.select().from(users),
    db.select().from(merchants),
    db.select().from(shops),
  ]);

  const userIds = new Set(userRows.map((user) => user.id));
  const merchantsById = new Map(merchantRows.map((merchant) => [merchant.id, merchant]));
  const claimedByUser = new Map<string, string[]>();

  for (const merchant of merchantRows) {
    if (!merchant.userId) continue;
    const merchantIds = claimedByUser.get(merchant.userId) || [];
    merchantIds.push(merchant.id);
    claimedByUser.set(merchant.userId, merchantIds);
  }

  const merchantWithoutUser = merchantRows
    .filter((merchant) => merchant.userId && !userIds.has(merchant.userId))
    .map((merchant) => ({ merchantId: merchant.id, email: merchant.email }));
  const shopWithoutMerchant = shopRows
    .filter((shop) => !merchantsById.has(shop.merchantId))
    .map((shop) => ({ shopId: shop.id, slug: shop.slug }));
  const duplicateMerchantUser = [...claimedByUser.entries()]
    .filter(([, merchantIds]) => merchantIds.length > 1)
    .map(([userId, merchantIds]) => ({ userId, merchantIds }));
  const unclaimedShops = shopRows.flatMap((shop) => {
    const merchant = merchantsById.get(shop.merchantId);
    return merchant && !merchant.userId
      ? [{ shopId: shop.id, slug: shop.slug, name: shop.name, merchantEmail: merchant.email }]
      : [];
  });

  return {
    totals: {
      users: userRows.length,
      merchants: merchantRows.length,
      shops: shopRows.length,
      claimedMerchants: merchantRows.filter((merchant) => Boolean(merchant.userId)).length,
      unclaimedMerchants: merchantRows.filter((merchant) => !merchant.userId).length,
    },
    violations: { merchantWithoutUser, shopWithoutMerchant, duplicateMerchantUser },
    unclaimedShops,
    healthy: merchantWithoutUser.length === 0 && shopWithoutMerchant.length === 0 && duplicateMerchantUser.length === 0,
  };
}
