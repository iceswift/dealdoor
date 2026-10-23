import type { Deal, Shop } from '../db-schema';

import { getSiteOrigin } from '../site';

type ShopRef = Pick<Shop, 'slug'>;
type DealRef = Pick<Deal, 'id'>;

export function getShopUrl(shop: ShopRef): string {
  return `/${shop.slug}`;
}

export function getDealUrl(_shop: ShopRef, deal: DealRef): string {
  return `/deal/${encodeURIComponent(deal.id)}`;
}

export function getLegacyDealUrl(shop: ShopRef, deal: DealRef): string {
  return `${getShopUrl(shop)}?deal=${encodeURIComponent(deal.id)}`;
}

export function getAbsoluteDealUrl(shop: ShopRef, deal: DealRef, origin = getSiteOrigin()): string {
  return `${origin.replace(/\/$/, '')}${getDealUrl(shop, deal)}`;
}

export function getDealShareText(
  shop: Pick<Shop, 'name'>,
  deal: Pick<Deal, 'title' | 'shortDescription' | 'discountText'>
): string {
  const benefit = deal.discountText ? `${deal.discountText} - ` : '';
  const summary = deal.shortDescription || deal.title;
  return `${benefit}${summary} @ ${shop.name}`;
}
