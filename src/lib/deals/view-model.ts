import type { Deal, Shop } from '../../../db/schema';
import {
  CLAIM_TYPE_LABELS,
  DEAL_CATEGORY_COLORS,
  DEAL_CATEGORY_LABELS,
  type ClaimType,
  type DealCategory,
} from '../constants';
import { formatDateShort, getDaysRemaining } from '../utils';
import { getAbsoluteDealUrl, getDealShareText, getDealUrl, getShopUrl } from './urls';

export type DealStatus = 'active' | 'scheduled' | 'expired' | 'inactive';
export type DealUrgency = 'normal' | 'soon' | 'expired';

export interface DealViewModel {
  id: string;
  title: string;
  categoryLabel: string;
  categoryColor: string;
  imageUrl: string | null;
  imageAlt: string;
  summary: string;
  description: string | null;
  discountLabel: string | null;
  conditions: string | null;
  couponCode: string | null;
  claimType: ClaimType;
  claimLabel: string;
  status: DealStatus;
  urgency: DealUrgency;
  daysLeft: number;
  expiryLabel: string;
  urls: {
    shop: string | null;
    deal: string | null;
    absoluteDeal: string | null;
  };
  shareText: string;
  shop: {
    name: string | null;
    logoImage: string | null;
    coverImage: string | null;
    addressShort: string | null;
    lineUrl: string | null;
    phoneUrl: string | null;
    mapUrl: string | null;
  };
}

type ShopForDeal = Pick<
  Shop,
  'slug' | 'name' | 'logoImage' | 'coverImage' | 'address' | 'lineId' | 'phone' | 'latitude' | 'longitude'
>;

function getDealStatus(deal: Deal): DealStatus {
  const now = new Date();
  const startDate = deal.startDate ? new Date(deal.startDate) : null;
  const endDate = new Date(deal.endDate);

  if (!deal.isActive) return 'inactive';
  if (endDate < now) return 'expired';
  if (startDate && startDate > now) return 'scheduled';
  return 'active';
}

function getAddressShort(address?: string | null): string | null {
  if (!address) return null;
  const parts = address.trim().split(/\s+/);
  return parts.slice(-3).join(' ');
}

function getLineUrl(lineId?: string | null): string | null {
  if (!lineId) return null;
  return lineId.startsWith('@') ? `https://line.me/ti/p/${lineId}` : lineId;
}

function getMapUrl(shop?: Pick<Shop, 'latitude' | 'longitude'> | null): string | null {
  if (!shop?.latitude || !shop.longitude) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
}

export function getDealViewModel(deal: Deal, shop?: ShopForDeal | null, origin?: string): DealViewModel {
  const status = getDealStatus(deal);
  const endDate = new Date(deal.endDate);
  const daysLeft = getDaysRemaining(endDate);
  const category = deal.category as DealCategory;
  const claimType = deal.claimType as ClaimType;
  const urgency: DealUrgency = status === 'expired' || status === 'inactive' ? 'expired' : daysLeft <= 7 ? 'soon' : 'normal';
  const summary = deal.shortDescription || deal.description || deal.discountText || deal.title;
  const fallbackImage = shop?.coverImage || shop?.logoImage || null;

  return {
    id: deal.id,
    title: deal.title,
    categoryLabel: DEAL_CATEGORY_LABELS[category] || deal.category,
    categoryColor: DEAL_CATEGORY_COLORS[category] || '#6B7280',
    imageUrl: deal.imageUrl || fallbackImage,
    imageAlt: `${deal.title}${shop?.name ? ` - ${shop.name}` : ''}`,
    summary,
    description: deal.description || null,
    discountLabel: deal.discountText || null,
    conditions: deal.conditions || null,
    couponCode: deal.couponCode || null,
    claimType,
    claimLabel: CLAIM_TYPE_LABELS[claimType] || deal.claimType,
    status,
    urgency,
    daysLeft,
    expiryLabel:
      status === 'expired' || status === 'inactive'
        ? 'หมดอายุแล้ว'
        : daysLeft <= 0
          ? 'หมดอายุวันนี้'
          : daysLeft <= 7
            ? `เหลือ ${daysLeft} วัน`
            : `ถึง ${formatDateShort(endDate)}`,
    urls: {
      shop: shop ? getShopUrl(shop) : null,
      deal: shop ? getDealUrl(shop, deal) : null,
      absoluteDeal: shop ? getAbsoluteDealUrl(shop, deal, origin) : null,
    },
    shareText: shop ? getDealShareText(shop, deal) : deal.shortDescription || deal.title,
    shop: {
      name: shop?.name || null,
      logoImage: shop?.logoImage || null,
      coverImage: shop?.coverImage || null,
      addressShort: getAddressShort(shop?.address),
      lineUrl: getLineUrl(shop?.lineId),
      phoneUrl: shop?.phone ? `tel:${shop.phone}` : null,
      mapUrl: getMapUrl(shop),
    },
  };
}

