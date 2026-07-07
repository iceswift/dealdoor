import type { deals, shops } from '../../../db/schema';
import {
  SHOP_CATEGORIES,
  SHOP_CATEGORY_COLORS,
  SHOP_CATEGORY_ICONS,
  SHOP_CATEGORY_LABELS,
} from '../constants';
import type { ShopCategory } from '../constants';

type Deal = typeof deals.$inferSelect;
type Shop = typeof shops.$inferSelect;
type DealWithShop = { deal: Deal; shop: Shop | null };
type ShopDealGroup = { shop: Shop; deals: Deal[] };

const DAY_LABELS: Record<string, string> = {
  mon: 'จันทร์',
  tue: 'อังคาร',
  wed: 'พุธ',
  thu: 'พฤหัส',
  fri: 'ศุกร์',
  sat: 'เสาร์',
  sun: 'อาทิตย์',
};

const SHORT_DAY_LABELS: Record<string, string> = {
  mon: 'จ.',
  tue: 'อ.',
  wed: 'พ.',
  thu: 'พฤ.',
  fri: 'ศ.',
  sat: 'ส.',
  sun: 'อา.',
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export type ExploreMapPin = {
  shopId: string;
  shopSlug: string;
  shopName: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  logoImage: string | null;
  address: string;
  openingHours: string;
  latitude: number;
  longitude: number;
  activeDealCount: number;
  urgentDealCount: number;
  isOpen: boolean;
  hasCouponCode: boolean;
  claimTypes: string[];
  bestEndTime: number;
  amenityTags: string[];
  bestDeal: {
    id: string;
    title: string;
    discountText: string;
    imageUrl: string;
    expiryLabel: string;
    href: string;
  } | null;
  shopHref: string;
  directionsHref: string;
  searchText: string;
};

export function getExploreCategories() {
  return [
    { id: 'all', label: 'ทั้งหมด', icon: '✨' },
    ...SHOP_CATEGORIES.map((cat) => ({
      id: cat,
      label: SHOP_CATEGORY_LABELS[cat],
      icon: SHOP_CATEGORY_ICONS[cat],
    })),
  ];
}

export function isShopCategory(value?: string | null): value is ShopCategory {
  return !!value && SHOP_CATEGORIES.includes(value as ShopCategory);
}

export function formatOpeningHours(value?: string | null) {
  if (!value) return '';

  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return trimmed;

  try {
    const parsed = JSON.parse(trimmed) as Record<string, string>;
    const entries = DAY_ORDER
      .map((day) => [day, parsed[day]] as const)
      .filter(([, hours]) => Boolean(hours));

    if (entries.length === 0) return '';

    const uniqueHours = Array.from(new Set(entries.map(([, hours]) => hours)));
    if (uniqueHours.length === 1) return `ทุกวัน ${uniqueHours[0]}`;

    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const weekdayHours = weekdays.map((day) => parsed[day]);
    const weekendHours = ['sat', 'sun'].map((day) => parsed[day]);
    const sameWeekday = weekdayHours.every((hours) => hours && hours === weekdayHours[0]);
    const sameWeekend = weekendHours.every((hours) => hours && hours === weekendHours[0]);

    if (sameWeekday && sameWeekend) {
      return `จันทร์-ศุกร์ ${weekdayHours[0]}, เสาร์-อาทิตย์ ${weekendHours[0]}`;
    }

    const ranges: Array<{ start: string; end: string; hours: string }> = [];
    entries.forEach(([day, hours]) => {
      const last = ranges[ranges.length - 1];
      if (last && last.hours === hours) {
        last.end = day;
      } else {
        ranges.push({ start: day, end: day, hours });
      }
    });

    return ranges
      .map(({ start, end, hours }) => {
        const label = start === end
          ? SHORT_DAY_LABELS[start] || DAY_LABELS[start] || start
          : `${SHORT_DAY_LABELS[start] || DAY_LABELS[start] || start}-${SHORT_DAY_LABELS[end] || DAY_LABELS[end] || end}`;
        return `${label} ${hours}`;
      })
      .join(', ');
  } catch {
    return trimmed;
  }
}

export function getExpiryLabel(endDate: Date, now = new Date()) {
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'หมดวันนี้';
  if (daysLeft === 1) return 'เหลือ 1 วัน';
  if (daysLeft <= 7) return `เหลือ ${daysLeft} วัน`;
  return `ถึง ${endDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`;
}

export function getBestDeal(shopDeals: Deal[], now = new Date()) {
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return [...shopDeals].sort((a, b) => {
    const aSoon = new Date(a.endDate) <= in7Days ? 0 : 1;
    const bSoon = new Date(b.endDate) <= in7Days ? 0 : 1;
    if (aSoon !== bSoon) return aSoon - bSoon;
    return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
  })[0];
}

export function getExploreMapData(activeDeals: DealWithShop[], now = new Date()) {
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dealsByShop = new Map<string, ShopDealGroup>();

  activeDeals.forEach(({ deal, shop }) => {
    if (!shop) return;
    if (!dealsByShop.has(shop.id)) {
      dealsByShop.set(shop.id, { shop, deals: [] });
    }
    dealsByShop.get(shop.id)!.deals.push(deal);
  });

  const shopGroups = Array.from(dealsByShop.values());
  const expiringSoon = activeDeals.filter(({ deal }) => new Date(deal.endDate) <= in7Days);
  const mappedShops = shopGroups.filter(({ shop }) => shop.latitude && shop.longitude);
  const unmappedShops = shopGroups.filter(({ shop }) => !shop.latitude || !shop.longitude);

  const mapPins: ExploreMapPin[] = mappedShops.map(({ shop, deals: shopDeals }) => {
    const bestDeal = getBestDeal(shopDeals, now);
    const bestEndDate = bestDeal ? new Date(bestDeal.endDate) : null;
    const urgentDealCount = shopDeals.filter((deal) => new Date(deal.endDate) <= in7Days).length;
    const category = shop.category as ShopCategory;
    const latitude = Number(shop.latitude);
    const longitude = Number(shop.longitude);
    const openingHours = formatOpeningHours(shop.openingHours);

    return {
      shopId: shop.id,
      shopSlug: shop.slug,
      shopName: shop.name,
      category: shop.category,
      categoryLabel: SHOP_CATEGORY_LABELS[category] || shop.category,
      categoryIcon: SHOP_CATEGORY_ICONS[category] || '📍',
      categoryColor: SHOP_CATEGORY_COLORS[category] || '#6B7280',
      logoImage: shop.logoImage,
      address: shop.address || '',
      openingHours,
      latitude,
      longitude,
      activeDealCount: shopDeals.length,
      urgentDealCount,
      isOpen: shop.isOpen ?? true,
      hasCouponCode: shopDeals.some((deal) => !!deal.couponCode),
      claimTypes: Array.from(new Set(shopDeals.map((deal) => deal.claimType))),
      bestEndTime: bestEndDate?.getTime() || Number.MAX_SAFE_INTEGER,
      amenityTags: [
        shop.wheelchairAccessible ? 'วีลแชร์' : '',
        shop.freeParking ? 'ที่จอดฟรี' : '',
        shop.paidParking ? 'ที่จอดรถ' : '',
        shop.nearbyBts ? `BTS ${shop.nearbyBts}` : '',
        shop.nearbyMrt ? `MRT ${shop.nearbyMrt}` : '',
        shop.petFriendly ? 'สัตว์เลี้ยงเข้าได้' : '',
        shop.kidsMenu || shop.highChairs || shop.playArea || shop.babyChanging ? 'เหมาะกับครอบครัว' : '',
      ].filter(Boolean),
      bestDeal: bestDeal && bestEndDate
        ? {
            id: bestDeal.id,
            title: bestDeal.title,
            discountText: bestDeal.discountText || '',
            imageUrl: bestDeal.imageUrl || '',
            expiryLabel: getExpiryLabel(bestEndDate, now),
            href: `/deal/${bestDeal.id}`,
          }
        : null,
      shopHref: `/${shop.slug}`,
      directionsHref: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
      searchText: `${shop.name} ${shop.address || ''} ${openingHours} ${shop.nearbyBts || ''} ${shop.nearbyMrt || ''} ${shop.accessibilityNotes || ''} ${shop.parkingNotes || ''} ${shop.petNotes || ''} ${shop.familyNotes || ''} ${shopDeals
        .map((deal) => `${deal.title} ${deal.description || ''} ${deal.discountText || ''} ${deal.couponCode || ''}`)
        .join(' ')}`.toLowerCase(),
    };
  });

  return {
    dealsByShop,
    expiringSoon,
    mappedShops,
    unmappedShops,
    mapPins,
  };
}
