# DealDoor — Design Documentation Index

> ดีลไหนดี — หน้าโปรโมชันร้านค้า แชร์ง่าย หมดอายุเอง พร้อมแผนที่และช่องทางติดต่อ

---

## Documentation Overview

### Core Design (01-10)

| # | Document | Description |
|---|----------|-------------|
| 01 | [Product Plan](./01-product-plan.md) | Product vision, scope, user flows, success criteria |
| 02 | [UI/UX Design](./02-ui-design.md) | Colors, typography, layouts, wireframes, interactions |
| 03 | [Data Architecture](./03-data-architecture.md) | Database schema, Drizzle ORM, mock data |
| 04 | [Page Routing](./04-page-routing.md) | URLs, routes, SEO, sitemap |
| 05 | [Technical Architecture](./05-technical-architecture.md) | Tech stack, project structure, deployment |
| 06 | [Component Design](./06-component-design.md) | React/Astro components, props, examples |
| 07 | [API Design](./07-api-design.md) | Database queries, mutations, API routes |
| 08 | [Monetization & Tier](./08-monetization-tier-design.md) | Free vs Pro, pricing, upgrade flow |
| 09 | [i18n Design](./09-i18n-design.md) | Multi-language support (TH/EN), translation files |
| 10 | [Theme Design](./10-theme-design.md) | Light/dark mode, CSS variables, toggle component |

### Extended Design (11-19)

| # | Document | Description |
|---|----------|-------------|
| 11 | [Auth Design](./11-auth-design.md) | Authentication, sessions, protected routes |
| 12 | [Image Handling](./12-image-handling.md) | Upload, optimization, storage, placeholders |
| 13 | [Onboarding Flow](./13-onboarding-flow.md) | Merchant first-time experience, wizard steps |
| 14 | [Error & Edge Cases](./14-error-edge-cases.md) | Error pages, validation, offline handling |
| 15 | [SEO & Structured Data](./15-seo-structured-data.md) | Meta tags, JSON-LD, sitemap, rich snippets |
| 16 | [QR Code Design](./16-qr-code-design.md) | Generation, branding, print-ready, API |
| 17 | [Analytics Design](./17-analytics-design.md) | Event tracking, merchant dashboard metrics |
| 18 | [PWA & Deep Links](./18-pwa-deep-links.md) | Service worker, install prompt, LINE/FB sharing |
| 19 | [Testing Strategy](./19-testing-strategy.md) | Unit, integration, E2E, visual regression |

### Operations & Infrastructure (20-23)

| # | Document | Description |
|---|----------|-------------|
| 20 | [Deployment & DevOps](./20-deployment-devops.md) | Docker, CI/CD, environments, backup |
| 21 | [Performance & Caching](./21-performance-caching.md) | CDN, lazy loading, cache headers, optimization |
| 22 | [Security Design](./22-security-design.md) | Input validation, XSS/CSRF, rate limiting |
| 23 | [Monitoring & Logging](./23-monitoring-logging.md) | Health checks, error tracking, alerting |

### Platform Features (24-28)

| # | Document | Description |
|---|----------|-------------|
| 24 | [Notifications System](./24-notifications-system.md) | In-app notifications and job scheduler |
| 25 | [Content Moderation](./25-content-moderation.md) | Report system, auto-filtering, admin dashboard |
| 26 | [Customer Features](./26-customer-features.md) | Save deals, favorites, deal alerts, preferences |
| 27 | [Legal & Compliance](./27-legal-compliance.md) | Terms, privacy, PDPA, cookie consent |
| 28 | [Accessibility](./28-accessibility.md) | WCAG 2.1 AA, keyboard nav, screen readers, ARIA |

---

## Quick Reference

### Tech Stack
- **Framework:** Astro + React
- **Language:** TypeScript
- **Database:** SQLite (Drizzle ORM)
- **Styling:** Tailwind CSS
- **Deployment:** Node server → Cloudflare D1

### Core Features (MVP)
1. Public shop deal page
2. Merchant dashboard
3. Basic explore page
4. Multi-language (TH/EN)
5. Light/dark theme
6. QR code generation
7. Basic analytics

### Key URLs
- Landing: `/`
- Shop page: `/[slug]`
- Explore: `/explore`
- Dashboard: `/dashboard`

### Mock Shops
1. Moon Bowl Cafe (Cafe/Dessert)
2. Aroi Noodle House (Restaurant)
3. Glow Hair Studio (Beauty)

---

## Document Summary by Topic

### Product & Business
- [01-product-plan.md](./01-product-plan.md) — Vision, scope, success criteria
- [08-monetization-tier-design.md](./08-monetization-tier-design.md) — Free vs Pro, pricing
- [13-onboarding-flow.md](./13-onboarding-flow.md) — Merchant onboarding
- [27-legal-compliance.md](./27-legal-compliance.md) — Terms, privacy, PDPA

### UI & Frontend
- [02-ui-design.md](./02-ui-design.md) — Colors, typography, wireframes
- [06-component-design.md](./06-component-design.md) — React/Astro components
- [09-i18n-design.md](./09-i18n-design.md) — Multi-language
- [10-theme-design.md](./10-theme-design.md) — Light/dark mode
- [28-accessibility.md](./28-accessibility.md) — WCAG, keyboard nav, ARIA

### Backend & Data
- [03-data-architecture.md](./03-data-architecture.md) — Database schema
- [07-api-design.md](./07-api-design.md) — API routes, queries
- [11-auth-design.md](./11-auth-design.md) — Authentication
- [12-image-handling.md](./12-image-handling.md) — Image upload & storage

### SEO & Discovery
- [04-page-routing.md](./04-page-routing.md) — URLs, routes
- [15-seo-structured-data.md](./15-seo-structured-data.md) — JSON-LD, rich snippets
- [16-qr-code-design.md](./16-qr-code-design.md) — QR codes
- [18-pwa-deep-links.md](./18-pwa-deep-links.md) — Deep links

### Operations & Quality
- [05-technical-architecture.md](./05-technical-architecture.md) — Stack, deployment
- [14-error-edge-cases.md](./14-error-edge-cases.md) — Error handling
- [17-analytics-design.md](./17-analytics-design.md) — Metrics, tracking
- [19-testing-strategy.md](./19-testing-strategy.md) — Testing approach
- [20-deployment-devops.md](./20-deployment-devops.md) — Docker, CI/CD, environments
- [21-performance-caching.md](./21-performance-caching.md) — CDN, optimization
- [22-security-design.md](./22-security-design.md) — Input validation, XSS/CSRF
- [23-monitoring-logging.md](./23-monitoring-logging.md) — Health checks, alerting

### Platform Features
- [24-notifications-system.md](./24-notifications-system.md) — Email, LINE, in-app
- [25-content-moderation.md](./25-content-moderation.md) — Reports, auto-filtering
- [26-customer-features.md](./26-customer-features.md) — Save, favorites, alerts

---

## Next Steps

1. Initialize Astro project with `pnpm create astro`
2. Install dependencies (React, Tailwind, Drizzle)
3. Set up database schema and seed data
4. Build components in order:
   - Shared components (Header, Footer, Badge)
   - Shop page (highest priority)
   - Dashboard
   - Explore page
5. Test with mock data
6. Deploy to VPS/Render

---

## File Structure

```
UNiPEX Project/DealDoor/
└── docs/
    ├── README.md (this file)
    ├── 01-product-plan.md
    ├── 02-ui-design.md
    ├── 03-data-architecture.md
    ├── 04-page-routing.md
    ├── 05-technical-architecture.md
    ├── 06-component-design.md
    ├── 07-api-design.md
    ├── 08-monetization-tier-design.md
    ├── 09-i18n-design.md
    ├── 10-theme-design.md
    ├── 11-auth-design.md
    ├── 12-image-handling.md
    ├── 13-onboarding-flow.md
    ├── 14-error-edge-cases.md
    ├── 15-seo-structured-data.md
    ├── 16-qr-code-design.md
    ├── 17-analytics-design.md
    ├── 18-pwa-deep-links.md
    ├── 19-testing-strategy.md
    ├── 20-deployment-devops.md
    ├── 21-performance-caching.md
    ├── 22-security-design.md
    ├── 23-monitoring-logging.md
    ├── 24-notifications-system.md
    ├── 25-content-moderation.md
    ├── 26-customer-features.md
    ├── 27-legal-compliance.md
    └── 28-accessibility.md
```
