<div align="center">
  <img src="public/icons/DealDoor_icon.png" alt="DealDoor logo" width="76" />
  <h1>DealDoor</h1>
  <p><strong>A digital storefront and local deal discovery platform for small businesses.</strong></p>
  <p>One shareable shop page. Time-limited promotions. A merchant workspace behind it.</p>
  <p><a href="#product-experience">Product</a> &middot; <a href="#engineering-highlights">Engineering</a> &middot; <a href="#code-tour">Code tour</a> &middot; <a href="#run-locally">Run locally</a></p>
</div>

---

DealDoor brings shop information, promotions, contact channels, and location into one public page. Customers discover offers and find a business; merchants manage their storefront and deals from a dedicated dashboard.

Built around Thai local businesses, the project connects customer discovery, merchant operations, and platform moderation in a single full-stack application.

**Stack:** Astro · React · TypeScript · Tailwind CSS · Drizzle ORM · SQLite / PostgreSQL · Bun

## Demo Accounts

The dedicated demo deployment provides Free and Pro merchant accounts plus a read-only Admin account. Credentials and hosting details are documented in [Demo deployment](docs/demo-deployment.md). These accounts apply to the isolated demo environment, not production.

## Product Experience

| Audience | Experience |
| --- | --- |
| Customers | Browse promotions, explore shops on a map, open deal details, save deals locally, and contact a shop. |
| Merchants | Register, complete onboarding, edit a storefront, manage promotions and redemption quotas, review analytics, manage Boost campaigns, and share a shop link or QR code. |
| Platform operators | Review shop and deal reports, inspect audit logs, and manage Boost campaigns through admin tools. |

```mermaid
flowchart LR
    A[Merchant onboarding] --> B[Shop and deal management]
    B --> C[Public storefront]
    C --> D[Customer discovery]
    D --> E[Deal details and contact]
    E --> F[Analytics events]
    F --> B
```

### A Storefront That Goes Beyond a Promotion Card

Each shop has a dynamic `/{slug}` page that brings its identity, offers, opening information, location, and contact links together. QR sharing connects the same storefront to offline touchpoints such as a counter or table.

The public experience includes category browsing, map exploration, individual deal pages, and browser-local saved deals. The merchant workspace handles the content that powers those pages.

## Engineering Highlights

| Area | Implementation and purpose |
| --- | --- |
| Server-rendered application | Astro server output with a standalone Node adapter; React components provide interactive forms and controls. |
| Relational data | Drizzle schemas, migrations, runtime adapters, and portability checks support SQLite and PostgreSQL. Identity integrity tools cover the user/merchant/shop relationship. |
| Authentication | Argon2 password hashing, database-backed sessions, session renewal, and HTTP-only session cookies. |
| Media pipeline | Sharp processes uploads into WebP, preserving aspect ratio and avoiding enlargement. Storage drivers support local files and Cloudflare R2. |
| Merchant insights | A dedicated analytics service connects event recording with merchant overview, deal performance, and conversion reporting. |
| Discovery | Leaflet map exploration and dedicated deal/map view models keep presentation data explicit. |
| Sharing and search visibility | Server-generated QR codes, dynamic shop URLs, sitemap generation, and LocalBusiness/Offer structured-data helpers. |
| Notifications | Inbox APIs, preferences, streaming updates, scheduled scans, and a delivery outbox separate notification creation from delivery. |
| Boost campaigns | Wallets, plan entitlements, credit transactions, campaign ranking, credit-order foundations, analytics, and admin controls. |
| Trust and operations | Report workflows, admin audit logs, consent-gated browser analytics, request rate limiting, validation helpers, and security headers. |
| Localization | Thai/English dictionaries, locale-aware request handling, and an incremental translation roadmap. |

## Architecture

```mermaid
flowchart TD
    Browser[Customer and merchant browsers] --> Pages[Astro pages and React components]
    Pages --> API[Astro API routes]
    Pages --> Services[Server-side domain helpers]
    API --> Services
    Services --> ORM[Drizzle ORM]
    ORM --> DB[(SQLite or PostgreSQL)]
    API --> Images[Sharp image processing]
    Images --> Uploads[Local storage or Cloudflare R2]
```

The repository uses Bun for dependency management and scripts. Astro builds server output through `@astrojs/node`; the current `start` script runs that output with Bun.

## Code Tour

Start here to inspect the implementation rather than only the interface:

| Question | Entry point |
| --- | --- |
| How are business entities related? | [SQLite schema](db/schema.ts) and [PostgreSQL schema](db/schema.pg.ts) |
| How do login and sessions work? | [Authentication helpers](src/lib/auth.ts) and [request middleware](src/middleware.ts) |
| How does a shop become a public page? | [Dynamic storefront](src/pages/%5Bslug%5D.astro) |
| How are merchant edits handled? | [Dashboard pages](src/pages/dashboard) and [shop API](src/pages/api/shops) |
| How does map discovery work? | [Explore page](src/pages/explore/index.astro) and [map view model](src/lib/explore/map-view-model.ts) |
| How are business metrics calculated? | [Analytics service](src/server/services/analytics.service.ts) |
| What happens to an uploaded image? | [Upload pipeline](src/lib/upload.ts) and [storage drivers](src/server/services/media-storage.service.ts) |
| How are notifications delivered? | [Notification service](src/server/services/notification.service.ts) and [outbox](src/server/services/notification-outbox.service.ts) |
| How do Boost credits and campaigns work? | [Boost service](src/server/services/boost.service.ts) and [business rules](docs/boost-deal-rules.md) |
| How are reports reviewed? | [Report service](src/server/services/report.service.ts) and [moderation page](src/pages/admin/moderation.astro) |
| How is analytics consent enforced? | [Consent helpers](src/lib/consent.ts) and [tracking endpoint](src/pages/api/analytics/track.ts) |
| What is covered by unit tests? | [Library tests](src/lib/__tests__) and [analytics service tests](src/server/__tests__/analytics.service.test.ts) |

## Run Locally

Requires **Bun 1.3.14 or newer**, as declared in `package.json`.

```sh
git clone https://github.com/iceswift/dealdoor.git
cd dealdoor
bun install --frozen-lockfile
bun run db:push
bun run dev
```

Open [localhost:4321](http://localhost:4321). On a fresh checkout, `db:push` initializes the local schema. The current database module and Drizzle configuration use `db/dev.db`.

For optional sample storefronts, inspect and run `bun run db:seed` against a disposable local database. The seed script replaces existing sample data and includes development credentials; use it only for local evaluation.

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run test` | Run the Vitest suite |
| `bun run build` | Build the server application |
| `bun run start` | Run the built server |
| `bun run db:studio` | Inspect local data with Drizzle Studio |

Suggested walkthrough: register a merchant account, complete onboarding, create a promotion, open its public shop page, and inspect the matching deal and map views.

## Project Status

**An evolving portfolio project with implemented frontend and backend workflows.** This overview describes the code in this repository's current default branch; it does not claim a verified live deployment, production traffic, or a completed security review.

Some modules are foundations rather than complete production integrations. Boost credit orders do not imply a live payment gateway, and browser-local saved deals do not imply cross-device synchronization. A production release still needs deployment-specific configuration and end-to-end verification of integrations and scheduled jobs.

The [design documentation](docs/README.md) records broader product and engineering plans. Treat those documents as design intent where they differ from executable code.

## Further Reading

- [Product plan](docs/01-product-plan.md)
- [Data architecture](docs/03-data-architecture.md)
- [API design](docs/07-api-design.md)
- [Testing strategy](docs/19-testing-strategy.md)
- [Deployment design](docs/20-deployment-devops.md)
- [Backend architecture](BACKEND_ARCHITECTURE.md)
- [Notification operations](docs/notifications-operations.md)
- [PostgreSQL migration plan](docs/postgres-migration-plan.md)
- [Media storage](docs/media-storage.md)

Project by [iceswift](https://github.com/iceswift).
