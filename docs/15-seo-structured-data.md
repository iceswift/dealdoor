# DealDoor — SEO & Structured Data Design

---

## 1. Overview

SEO is critical for shop pages to appear in Google search results with rich snippets.

---

## 2. Meta Tags Strategy

### 2.1 Base Meta Tags

```astro
---
// src/layouts/BaseLayout.astro

interface Props {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const {
  title,
  description = 'หน้าโปรโมชันร้านค้า แชร์ง่าย หมดอายุเอง พร้อมแผนที่และช่องทางติดต่อ',
  image = '/og-default.png',
  url = Astro.url.href,
  type = 'website',
} = Astro.props;

const fullTitle = `${title} | DealDoor`;
---

<!DOCTYPE html>
<html lang={lang}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>{fullTitle}</title>
  <meta name="title" content={fullTitle} />
  <meta name="description" content={description} />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={type} />
  <meta property="og:url" content={url} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={new URL(image, Astro.site)} />
  <meta property="og:site_name" content="DealDoor" />
  <meta property="og:locale" content="th_TH" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content={url} />
  <meta property="twitter:title" content={fullTitle} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={new URL(image, Astro.site)} />
  
  <!-- Canonical -->
  <link rel="canonical" href={url} />
  
  <!-- Alternate Languages -->
  <link rel="alternate" hreflang="th" href={getLocalizedPath(Astro.url.pathname, 'th')} />
  <link rel="alternate" hreflang="en" href={getLocalizedPath(Astro.url.pathname, 'en')} />
  <link rel="alternate" hreflang="x-default" href={getLocalizedPath(Astro.url.pathname, 'th')} />
</head>
```

### 2.2 Shop Page Meta

```astro
---
// In shop page [slug].astro

const shopTitle = `${shop.name} — โปรโมชันล่าสุด`;
const shopDescription = shop.description || `ดูโปรโมชันล่าสุด ส่วนลด และดีลพิเศษจาก ${shop.name}`;
const shopImage = shop.coverImage || '/og-shop-default.png';
---

<BaseLayout
  title={shopTitle}
  description={shopDescription}
  image={shopImage}
  type="business.business"
/>
```

### 2.3 Deal Deep Link Meta

```astro
---
// When ?deal=id is present

const dealTitle = `${deal.title} — ${shop.name}`;
const dealDescription = deal.shortDescription || deal.description || deal.title;
---

<BaseLayout
  title={dealTitle}
  description={dealDescription}
  type="article"
/>
```

---

## 3. JSON-LD Structured Data

### 3.1 Local Business Schema

```typescript
// src/lib/seo.ts

export function generateLocalBusinessSchema(shop: Shop): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `https://dealdoor.co/${shop.slug}`,
    name: shop.name,
    description: shop.description,
    url: `https://dealdoor.co/${shop.slug}`,
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
    openingHoursSpecification: parseOpeningHours(shop.openingHours),
    sameAs: [
      shop.facebookUrl,
      shop.instagramUrl,
      shop.websiteUrl,
    ].filter(Boolean),
  };
}
```

### 3.2 Offer Schema (for Deals)

```typescript
export function generateOfferSchema(deal: Deal, shop: Shop): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: deal.title,
    description: deal.description || deal.shortDescription,
    url: `https://dealdoor.co/${shop.slug}?deal=${deal.id}`,
    validFrom: deal.startDate?.toISOString(),
    validThrough: deal.endDate.toISOString(),
    seller: {
      '@type': 'LocalBusiness',
      name: shop.name,
      url: `https://dealdoor.co/${shop.slug}`,
    },
    ...(deal.couponCode && {
      category: 'Coupon',
      identifier: deal.couponCode,
    }),
  };
}
```

### 3.3 Breadcrumb Schema

```typescript
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
```

### 3.4 FAQ Schema (for Shop Info)

```typescript
export function generateFAQSchema(shop: Shop, deals: Deal[]): object {
  const faqs = [];

  if (shop.openingHours) {
    faqs.push({
      question: `${shop.name} เปิดกี่โมง?`,
      answer: formatOpeningHours(shop.openingHours),
    });
  }

  if (shop.address) {
    faqs.push({
      question: `${shop.name} อยู่ที่ไหน?`,
      answer: shop.address,
    });
  }

  if (deals.length > 0) {
    faqs.push({
      question: `${shop.name} มีโปรโมชันอะไรบ้าง?`,
      answer: `ตอนนี้มี ${deals.length} โปรโมชัน: ${deals.map(d => d.title).join(', ')}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
```

---

## 4. Usage in Pages

### 4.1 Shop Page

```astro
---
import { generateLocalBusinessSchema, generateOfferSchema, generateBreadcrumbSchema } from '../lib/seo';

const localBusinessSchema = generateLocalBusinessSchema(shop);
const offerSchemas = activeDeals.map(deal => generateOfferSchema(deal, shop));
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'DealDoor', url: 'https://dealdoor.co' },
  { name: 'Explore', url: 'https://dealdoor.co/explore' },
  { name: shop.name, url: `https://dealdoor.co/${shop.slug}` },
]);
---

<BaseLayout>
  <!-- JSON-LD -->
  <script type="application/ld+json" set:html={JSON.stringify(localBusinessSchema)} />
  {offerSchemas.map(schema => (
    <script type="application/ld+json" set:html={JSON.stringify(schema)} />
  ))}
  <script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)} />
</BaseLayout>
```

---

## 5. Sitemap Generation

### 5.1 Dynamic Sitemap

```typescript
// src/pages/sitemap.xml.ts

import type { APIRoute } from 'astro';
import { getAllShops } from '../lib/queries';
import { SHOP_CATEGORIES } from '../lib/constants';

export const GET: APIRoute = async ({ site }) => {
  const shops = await getAllShops();
  
  const shopUrls = shops.map(shop => `
    <url>
      <loc>${site}/${shop.slug}</loc>
      <lastmod>${shop.updatedAt.toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  const categoryUrls = SHOP_CATEGORIES.map(cat => `
    <url>
      <loc>${site}/explore/${cat}</loc>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <url>
        <loc>${site}</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${site}/explore</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      ${categoryUrls}
      ${shopUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
```

### 5.2 robots.txt

```
# public/robots.txt

User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /api/

Sitemap: https://dealdoor.co/sitemap.xml
```

---

## 6. Open Graph Image Generation (Future)

### 6.1 Dynamic OG Images

```typescript
// src/pages/api/og/[slug].ts

import { ImageResponse } from '@vercel/og';

export async function GET({ params }) {
  const shop = await getShopBySlug(params.slug);

  return new ImageResponse(
    `
    <div style="display: flex; flex-direction: column; padding: 40px; background: white;">
      <h1 style="font-size: 48px;">${shop.name}</h1>
      <p style="font-size: 24px; color: #666;">${shop.description}</p>
      <div style="margin-top: 20px;">
        <span style="background: #FF6B35; color: white; padding: 8px 16px; border-radius: 8px;">
          ดูโปรโมชัน
        </span>
      </div>
    </div>
    `,
    {
      width: 1200,
      height: 630,
    }
  );
}
```

---

## 7. Page Speed Optimization

### 7.1 Critical CSS

```astro
<!-- Inline critical CSS -->
<style>
  /* Above-the-fold styles */
  body { margin: 0; font-family: 'Inter', sans-serif; }
  .hero { padding: 2rem; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### 7.2 Resource Hints

```astro
<head>
  <!-- Preconnect to external origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  
  <!-- Preload critical assets -->
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
</head>
```

### 7.3 Image Optimization

```astro
<!-- Responsive images -->
<img
  src="/images/shop-cover.webp"
  srcset="/images/shop-cover-400.webp 400w,
          /images/shop-cover-800.webp 800w,
          /images/shop-cover-1200.webp 1200w"
  sizes="(max-width: 480px) 100vw, 480px"
  alt="Shop cover"
  loading="lazy"
  decoding="async"
/>
```

---

## 8. Canonical URLs

```astro
---
// Prevent duplicate content
const canonicalUrl = new URL(Astro.url.pathname, Astro.site).href;
---

<link rel="canonical" href={canonicalUrl} />
```

---

## 9. hreflang Tags

```astro
---
// For multi-language support
const currentPath = Astro.url.pathname;
---

<link rel="alternate" hreflang="th" href={`https://dealdoor.co${currentPath}`} />
<link rel="alternate" hreflang="en" href={`https://dealdoor.co/en${currentPath}`} />
<link rel="alternate" hreflang="x-default" href={`https://dealdoor.co${currentPath}`} />
```

---

## 10. SEO Checklist

### Per Page

- [ ] Unique title tag (< 60 chars)
- [ ] Meta description (< 160 chars)
- [ ] Canonical URL
- [ ] Open Graph tags
- [ ] Twitter Card tags
- [ ] JSON-LD structured data
- [ ] H1 tag (one per page)
- [ ] Alt text for images
- [ ] Internal linking

### Site-wide

- [ ] sitemap.xml
- [ ] robots.txt
- [ ] HTTPS
- [ ] Mobile-friendly
- [ ] Fast loading (< 3s)
- [ ] No broken links
- [ ] Clean URL structure

---

## 11. File Structure

```
src/
├── lib/
│   └── seo.ts              # Schema generators
├── layouts/
│   └── BaseLayout.astro    # Meta tags
└── pages/
    ├── sitemap.xml.ts      # Dynamic sitemap
    └── api/
        └── og/             # OG image generation
```
