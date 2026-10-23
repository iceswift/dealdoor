# Known Limitations and Roadmap

This is a working portfolio demo, not a claim of production readiness. Status reviewed October 23, 2026.

## Current Boundaries

| Area | Current boundary |
| --- | --- |
| Public demo | Shared merchant sample data; no per-visitor isolation or automatic reset. Registration and uploads are disabled, and Admin is read-only. Do not enter private information. |
| Hosting | One self-hosted instance with SQLite and persistent media, limited to 512 MiB RAM and one CPU. No uptime SLA or measured concurrent-user capacity. |
| Analytics | Real sample data can be empty. No fabricated conversion figures or production traffic claims. |
| Payments | Boost credit-order and wallet foundations do not constitute a live payment gateway. |
| Saved deals | Browser-local storage, not authenticated cross-device synchronization. |
| Database | SQLite powers the live demo. PostgreSQL schemas and migration tools exist, but the main CI workflow does not run a PostgreSQL integration environment. |
| Localization | Thai/English infrastructure exists; translation work remains incremental. |
| Assurance | Passing tests are not a complete security, accessibility, legal, or load review. Long-lived SSE reconnection and physical-device QR scanning still need dedicated verification. |

## Prioritized Next Steps

These are planned improvements, not completed features or delivery commitments.

1. **Demo hygiene:** scheduled sample-data reset, per-visitor isolation where practical, aggregate storage limits, and retention policies before widening write access.
2. **Operational confidence:** exercise backup restoration, monitor memory/disk/error rates, and document recovery procedures against the deployed setup.
3. **Verification depth:** browser journeys across mobile/desktop, accessibility checks, long-lived notification reconnection, and a real PostgreSQL integration CI job.
4. **Product completeness:** finish translation coverage and define synchronized saved deals only if account-based customer workflows are needed.
5. **Production integrations:** payment-provider verification, scheduled-job operations, abuse controls, and qualified legal review before accepting real payments or customer data.

## Automated Checks

[GitHub Actions](../.github/workflows/ci.yml) runs the locked install, unit/regression tests, production build, and disposable demo smoke checks for both restricted defaults and explicit private-test write opt-ins. The smoke suite creates its own temporary data; it does not test against or modify the public demo.

There is no automatic deployment in this workflow. A green badge does not imply successful home-server deployment, browser QA, linting, standalone type checking, or a load test.
