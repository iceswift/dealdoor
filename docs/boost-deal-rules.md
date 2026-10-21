# Boost Deal Rules

This document defines the product rules that later Boost wallet, campaign, payment, ranking, and analytics phases must enforce.

## Entitlements

| Plan | Included credits per billing cycle | Concurrent Boost campaigns | Can buy extra credits |
| --- | ---: | ---: | --- |
| Free | 0 | 1 | Yes, when payments launch |
| Pro | 4 | 2 | Yes, when payments launch |

## Credit Rules

- One Boost credit funds 24 hours of promotion.
- A campaign can run for at most 168 hours (7 days).
- Included plan credits reset at the start of a new billing cycle and never roll over.
- Purchased credits expire 180 days after payment confirmation.
- Duration is charged by rounded-up 24-hour blocks.

## Credit Packages

| Package | Credits | Price |
| --- | ---: | ---: |
| Starter | 3 | THB 79 |
| Growth | 8 | THB 199 |
| Business | 20 | THB 449 |

- Package selection and price are resolved server-side from the catalog; browsers never send a price or credit amount.
- Creating an order never adds credits. Credits are granted only after a verified provider webhook confirms payment.
- Payment confirmation is idempotent through the order status, provider reference, and Boost transaction idempotency key.
- Until a payment provider is configured, the merchant UI must show package information as unavailable rather than simulate a successful purchase.

## Eligibility Rules

A campaign may only start when its deal is active, not expired, has remaining redemption capacity when a quota applies, and is not moderated or paused. A campaign must stop when the deal becomes ineligible.

## Public Experience Rules

Boost is a relevance signal, not an override for unrelated searches. Every promoted placement must be visibly labelled as promoted. Map coordinates and distance ordering remain truthful.

## Analytics and Transparency

- A Boost impression is recorded only when a promoted deal card is at least 60% visible in the viewport.
- Views, clicks, claims, and coupon copies shown for a campaign are activities that happened during its active time window.
- The dashboard must label time-window activity as correlation, not prove that Boost caused every action.
- The per-campaign report must show the raw metrics and click-through rate; missing impressions means CTR is unavailable, not zero.

## Admin Moderation and Abuse

- Admins can review active campaigns at `/admin/boosts` and see signals for pending reports, missing or inactive deals, expired deals, and campaigns that outlive the deal.
- Stopping a campaign requires a reason, does not refund credits, and records the actor, target, shop, deal, and reason in the admin audit log.
- The browser-facing admin action may only stop a campaign. Credit adjustments and payment confirmation are never exposed through this moderation surface.
