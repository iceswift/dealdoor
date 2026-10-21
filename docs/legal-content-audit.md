# DealDoor Legal Content Audit

Audit date: 2026-07-16

Scope: the current Thai-facing legal pages and the data flows found in the
application source. This is a product and implementation audit, not legal
advice. A qualified Thai legal professional must approve the final notices and
terms before production launch.

## Executive Summary

The current `/terms`, `/privacy`, and `/cookies` pages provide a useful basic
outline, but no longer describe DealDoor accurately. The product now handles
merchant accounts, public shop and deal content, server-side analytics,
optional device location, media uploads, in-app notifications, reports,
Boost campaigns, and future payment orders.

Two P0 issues must be resolved before presenting the pages as production-ready:

1. `/privacy/request` displays success after a delay but does not create or
   send a data-subject request.
2. The cookie banner records a local preference, but internal analytics still
   records events with IP and user-agent independently of that preference.

## Evidence Sources

| Area | Primary implementation evidence |
| --- | --- |
| Sessions | `src/lib/auth.ts` |
| Locale cookie | `src/middleware.ts`, `src/i18n` |
| Local/session storage | `src/lib/saved-deals.ts`, `src/lib/onboarding.ts`, public pages |
| Device location | `src/pages/index.astro`, `src/pages/deals/index.astro`, `src/pages/explore/index.astro` |
| Analytics | `src/server/services/analytics.service.ts` |
| Media | `src/lib/upload.ts`, `src/server/services/media-storage.service.ts` |
| Notifications | `src/server/services/notification.service.ts` |
| Reports and admin audit | `src/server/services/report.service.ts`, `src/server/services/admin-audit.service.ts` |
| Boost and payment-ready orders | `src/server/services/boost.service.ts` |

## Data Inventory

| Data category | Examples | Storage / recipients | Current purpose | Notice requirement |
| --- | --- | --- | --- | --- |
| Account identity | name, email, password hash, role | database and session table | account, login, support, access control | controller, lawful basis, retention |
| Merchant profile | shop name, category, address, phone, social/contact links, opening hours | database; public shop page | publish merchant profile and contact details | state that merchant-provided content is public |
| Deal content | title, description, coupon, conditions, redemption quota, dates | database; public pages and search | publish and operate promotions | merchant accuracy, moderation, retention |
| Media | logo, cover, deal, menu images | local `public/uploads` or configured Cloudflare R2 | display merchant content | processor/location disclosure when R2 is enabled |
| Analytics and abuse data | event type, shop/deal IDs, IP, user-agent, timestamps | `analytics_events` | product metrics, unique counts, abuse prevention | describe data, purpose, retention, opt-out/consent model |
| Approximate device location | latitude, longitude, accuracy | browser session storage only in current flow | nearby deals and map centering | explicit permission and no server persistence statement |
| Preferences | theme, language, saved deals, favorite shops, onboarding draft, cookie preference | browser local/session storage | user experience | local storage inventory, expiry/clearing behavior |
| Notifications | notification content, read status, preferences | database and in-app stream | merchant product alerts | categories, delivery channels, retention |
| Reports and audit | report reason/details, target IDs, reviewer and audit metadata | database, admin-only pages | trust and safety, enforcement | purpose, access limits, retention |
| Payment-ready data | order ID, price, currency, provider reference, credit quantity | database; no provider configured yet | future Boost credit checkout | update before enabling a payment gateway |

## Storage Inventory

### Cookies

| Name | Type | Lifetime / flags | Purpose | Current classification |
| --- | --- | --- | --- | --- |
| `dealdoor_session` | HTTP cookie | 30 days; `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS | authenticated session | strictly necessary |
| locale cookie (`LOCALE_COOKIE`) | HTTP cookie | 1 year; `SameSite=Lax` | remember language route preference | functional |

The exact locale cookie name should be read from `src/i18n` before the final
cookie table is published.

### Browser Storage

| Key / pattern | Storage | Purpose | Classification |
| --- | --- | --- | --- |
| `dealdoor_cookie_consent` | localStorage | consent preference | necessary record / consent management |
| `theme` | localStorage | theme preference | functional |
| `dealdoor_saved_deals` | localStorage | saved deal IDs | functional |
| `dealdoor_favorite_shops` | localStorage | favorite shop IDs | functional |
| `dealdoor_onboarding` | localStorage | merchant onboarding draft, including phone/address fields | functional; contains personal/business data |
| user location session key | sessionStorage | latitude, longitude, accuracy for nearby/map | functional; location data |
| deals list state key | sessionStorage | discovery/list state | functional |

The final policy must not call localStorage a cookie. It should use the broader
term "cookies and similar technologies" and show both inventories.

## Current Legal Page Gap Analysis

### Privacy Notice (`/privacy`)

| Finding | Severity | Required change |
| --- | --- | --- |
| Data categories omit device location, notification data, report/audit records, Boost and payment-ready orders | P1 | Add a data-processing table by subject type and purpose |
| Analytics notice is too general for IP and user-agent collection | P0 | Describe internal analytics, unique-visitor calculation, abuse prevention, retention, and consent/basis |
| Media storage does not mention optional Cloudflare R2 | P1 | Identify processor categories and update before enabling R2 |
| Retention says account data is deleted in 30 days, but implementation and legal exceptions are not defined | P1 | Define verified retention schedule per data type; do not promise deletion until operationally enforced |
| Data subject request page is not operational | P0 | Implement authenticated request submission, verification, case tracking, and response process before making the promise |
| Controller identity, registered address, and responsible privacy contact are incomplete | P1 | Confirm the legal entity and add real contact details |

### Cookie Notice (`/cookies`)

| Finding | Severity | Required change |
| --- | --- | --- |
| Lists Plausible as an example despite no configured third-party analytics | P1 | State only technologies actually active; keep third-party entries disabled until deployed |
| Does not inventory actual session/local/session storage keys | P1 | Publish the inventory above, with purpose and duration |
| Consent banner preference does not gate internal analytics collection | P0 | Choose and implement the correct legal model: necessary/legitimate-interest analytics with clear disclosure, or consent-gated analytics |
| No visible way to reopen/change consent after dismissal | P1 | Add a persistent "Cookie settings" control and record version/date of choice |

### Terms (`/terms`)

| Finding | Severity | Required change |
| --- | --- | --- |
| Merchant obligations do not cover quota, coupon accuracy, public contact details, image rights, or moderation requests | P1 | Add merchant publishing and compliance obligations |
| No Boost-specific rules | P1 | Link or include eligibility, placement, credits, expiry, no-refund on voluntary/moderation stop, and analytics limitations |
| Future payment terms and refunds are missing | P1 | Add before activating a payment provider; do not accept payments first |
| Suspension language is too broad without process | P2 | Define notice, urgent safety exception, appeal/contact route, and effect on active Boost campaigns |
| Contact addresses are placeholders until ownership is confirmed | P1 | Verify `legal@dealdoor.co` and `privacy@dealdoor.co` are monitored and controlled |

## Recommended Decision Register

These product decisions are required before a final legal rewrite.

1. Legal controller: company/person name, Thai registration details, address,
   privacy contact, and whether a DPO is appointed.
2. Analytics model: consent-gated, legitimate-interest with opt-out, or remove
   IP/user-agent from metrics where not necessary.
3. Retention schedule: sessions, raw analytics, notifications, reports, audit
   logs, uploaded media, deleted merchant data, and payment records.
4. Processor/subprocessor list: VPS host, database backup provider, Cloudflare
   R2 (if enabled), email/push providers, and payment provider.
5. Location promise: confirm that user location remains client/session-only and
   is never sent to the application server unless a new feature explicitly
   requires it.
6. Merchant content policy: prohibited products/content, evidence standard for
   deals, appeal path, and repeated-abuse consequences.
7. Payments: legal merchant of record, VAT/tax treatment, refund policy, and
   payment provider terms before checkout is enabled.

## Implementation Backlog

### P0: Must complete before production claims

- Replace the simulated privacy-request form with a persisted DSAR workflow.
- Align the analytics implementation with consent/basis and the cookie notice.
- Remove or correct any policy statement that cannot be demonstrated in code.
- Confirm legal entity and monitored legal/privacy contacts.

### P1: Complete before enabling R2, payment, or external notifications

- Add versioned Thai and English privacy notices and terms.
- Add a cookie/settings center that can revisit consent.
- Publish exact cookies and browser-storage inventory.
- Add retention jobs and operational procedures matching the published schedule.
- Add merchant, Boost, payment, and moderation terms.

### P2: Post-launch maturity

- Record notice version and consent timestamp/server-side identifier where
  appropriate.
- Add a DSAR admin queue with identity verification and audit trail.
- Add a processor register and incident-response runbook.

## Acceptance Criteria for the Rewrite Phase

- Every statement maps to an implemented data flow or a documented operational
  procedure.
- Thai is the source legal language; English is a faithful operational
  translation, not a conflicting policy.
- The public pages show effective date, version, change summary, controller
  contact, and accessible links to the privacy-request path and cookie settings.
- Product releases that add R2, payment, email, LINE, advertising, or a new
  analytics provider require a legal-page review before being enabled.
