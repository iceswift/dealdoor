// src/lib/__tests__/seo.test.ts

import { describe, it, expect } from 'vitest';
import {
  generateLocalBusinessSchema,
  generateOfferSchema,
  generateBreadcrumbSchema,
} from '../seo';
import type { Shop, Deal } from '../../../db/schema';

const mockShop: Shop = {
  id: 'shop-1',
  merchantId: 'merchant-1',
  slug: 'moon-bowl-cafe',
  name: 'Moon Bowl Cafe',
  description: 'คาเฟ่ขนมหวาน',
  category: 'cafe',
  coverImage: 'https://example.com/cover.jpg',
  logoImage: 'https://example.com/logo.jpg',
  address: '123 สยาม',
  latitude: 13.7466,
  longitude: 100.5348,
  phone: '081-234-5678',
  lineId: '@moonbowlcafe',
  facebookUrl: 'https://facebook.com/moonbowlcafe',
  instagramUrl: 'https://instagram.com/moonbowlcafe',
  websiteUrl: null,
  openingHours: '{}',
  isOpen: true,
  tier: 'free',
  maxActiveDeals: 6,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDeal: Deal = {
  id: 'deal-1',
  shopId: 'shop-1',
  title: 'Birthday Free Brownie',
  category: 'birthday',
  description: 'ฟรีบราวนี่ 1 ชิ้น',
  shortDescription: 'ฟรีบราวนี่',
  discountText: 'ฟรีบราวนี่ 1 ชิ้น',
  conditions: 'สำหรับเดือนเกิด',
  couponCode: 'MOONBDAY',
  claimType: 'copy_code',
  imageUrl: null,
  startDate: null,
  endDate: new Date('2025-12-31'),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('generateLocalBusinessSchema', () => {
  it('generates valid LocalBusiness schema', () => {
    const schema = generateLocalBusinessSchema(mockShop) as any;

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('LocalBusiness');
    expect(schema.name).toBe('Moon Bowl Cafe');
    expect(schema.url).toContain('moon-bowl-cafe');
  });

  it('includes address when available', () => {
    const schema = generateLocalBusinessSchema(mockShop) as any;

    expect(schema.address).toBeDefined();
    expect(schema.address['@type']).toBe('PostalAddress');
    expect(schema.address.streetAddress).toBe('123 สยาม');
  });

  it('includes geo when coordinates available', () => {
    const schema = generateLocalBusinessSchema(mockShop) as any;

    expect(schema.geo).toBeDefined();
    expect(schema.geo['@type']).toBe('GeoCoordinates');
    expect(schema.geo.latitude).toBe(13.7466);
  });

  it('includes social links', () => {
    const schema = generateLocalBusinessSchema(mockShop) as any;

    expect(schema.sameAs).toContain('https://facebook.com/moonbowlcafe');
    expect(schema.sameAs).toContain('https://instagram.com/moonbowlcafe');
  });
});

describe('generateOfferSchema', () => {
  it('generates valid Offer schema', () => {
    const schema = generateOfferSchema(mockDeal, mockShop) as any;

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('Offer');
    expect(schema.name).toBe('Birthday Free Brownie');
  });

  it('includes seller info', () => {
    const schema = generateOfferSchema(mockDeal, mockShop) as any;

    expect(schema.seller).toBeDefined();
    expect(schema.seller['@type']).toBe('LocalBusiness');
    expect(schema.seller.name).toBe('Moon Bowl Cafe');
  });

  it('includes coupon code when available', () => {
    const schema = generateOfferSchema(mockDeal, mockShop) as any;

    expect(schema.identifier).toBe('MOONBDAY');
  });

  it('includes valid through date', () => {
    const schema = generateOfferSchema(mockDeal, mockShop) as any;

    expect(schema.validThrough).toBeDefined();
  });
});

describe('generateBreadcrumbSchema', () => {
  it('generates valid BreadcrumbList schema', () => {
    const items = [
      { name: 'Home', url: 'https://dealdoor.co' },
      { name: 'Shop', url: 'https://dealdoor.co/moon-bowl-cafe' },
    ];
    const schema = generateBreadcrumbSchema(items) as any;

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('BreadcrumbList');
    expect(schema.itemListElement).toHaveLength(2);
  });

  it('has correct position numbers', () => {
    const items = [
      { name: 'Home', url: 'https://dealdoor.co' },
      { name: 'Explore', url: 'https://dealdoor.co/explore' },
      { name: 'Shop', url: 'https://dealdoor.co/moon-bowl-cafe' },
    ];
    const schema = generateBreadcrumbSchema(items) as any;

    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[2].position).toBe(3);
  });
});
