// src/lib/seo.ts

import type { Shop, Deal } from './db-schema';
import { getSiteOrigin } from './site';

export function generateLocalBusinessSchema(shop: Shop, origin = getSiteOrigin()): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${origin}/${shop.slug}`,
    name: shop.name,
    description: shop.description,
    url: `${origin}/${shop.slug}`,
    image: shop.coverImage,
    logo: shop.logoImage,
    telephone: shop.phone,
    address: shop.address ? {
      '@type': 'PostalAddress',
      streetAddress: shop.address,
      addressCountry: 'TH',
    } : undefined,
    geo: shop.latitude && shop.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: shop.latitude,
      longitude: shop.longitude,
    } : undefined,
    sameAs: [
      shop.facebookUrl,
      shop.instagramUrl,
      shop.websiteUrl,
    ].filter(Boolean),
  };
}

export function generateOfferSchema(deal: Deal, shop: Shop, origin = getSiteOrigin()): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description: deal.description || deal.shortDescription,
    url: `${origin}/${shop.slug}?deal=${encodeURIComponent(deal.id)}`,
    validThrough: new Date(deal.endDate).toISOString(),
    seller: {
      '@type': 'LocalBusiness',
      name: shop.name,
      url: `${origin}/${shop.slug}`,
    },
    ...(deal.couponCode && {
      category: 'Coupon',
      identifier: deal.couponCode,
    }),
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
