# Internationalization Roadmap

## Purpose

Make DealDoor ready for Thai and English without duplicating pages or mixing translated UI text with merchant-owned content.

## Principles

- Thai is the default language and English is available under `/en`.
- New UI copy must use the i18n helpers and locale JSON files. Do not add new hard-coded user-facing strings to components or pages.
- Merchant content (shop names, deal titles, descriptions, menu items) remains in the language supplied by the merchant until the content-translation phase.
- Locale-aware links must preserve the selected language.
- Each completed phase must pass the checks listed below before it is marked complete.

## Current Architecture

- Locale resolution: request path and `dealdoor_locale` cookie.
- Default locale: `th`.
- English route form: `/en/...`; Thai keeps the existing unprefixed routes.
- Translation namespaces:
  - `src/i18n/th/common.json` and `src/i18n/en/common.json`
  - `src/i18n/th/public.json` and `src/i18n/en/public.json`
- Shared helpers: `src/i18n/index.ts`, `src/i18n/format.ts`, and `src/i18n/react.tsx`.

## Progress

### Phase 1 - Foundation and Routing

- [x] Define supported languages, locale parsing, fallback behavior, and URL helpers.
- [x] Add shared translation namespaces, interpolation, and locale-aware formatting helpers.
- [x] Add request middleware support for `/en/...` and persist the selected locale in a cookie.
- [x] Add unit tests and the translation parity audit.

### Phase 2 - Public Experience

- [ ] Finish shared header, mobile navigation, footer, and account menu copy.
- [ ] Finish Home, Explore, shop, and deal-detail UI copy, including client-side map states, empty states, and filters.
- [ ] Make every public navigation link locale-aware.
- [ ] Localize pricing, saved deals, shop onboarding, and legal pages.
- [ ] Verify Thai and English public routes in a real browser.

### Phase 3 - Merchant Workspace

- [ ] Localize dashboard navigation, forms, validation, empty states, and notifications.
- [ ] Ensure React islands receive the active locale through `I18nProvider`.
- [ ] Localize dates, prices, counts, chart labels, and operational status text.
- [ ] Keep merchant-entered content intact and visibly distinguish it from UI labels where necessary.

### Phase 4 - Content and Data Model

- [ ] Decide which merchant-owned fields need optional Thai/English variants.
- [ ] Add a backwards-compatible schema and migration path for translated shop, deal, menu, and category content.
- [ ] Provide dashboard editing and per-language completeness states.
- [ ] Define fallbacks when a selected-language translation is unavailable.

### Phase 5 - Admin, Notifications, and Email

- [ ] Localize admin monitoring, moderation, and audit-log UI.
- [ ] Store notification templates as translation keys plus parameters rather than pre-rendered strings.
- [ ] Localize notification drawer, email templates, and transactional errors.
- [ ] Verify that action URLs in notifications preserve the recipient locale.

### Phase 6 - Quality, SEO, and Release

- [ ] Add `<link rel="alternate" hreflang>` metadata and locale-aware canonical URLs.
- [ ] Audit every new Thai/English key for parity and remove remaining hard-coded UI copy.
- [ ] Add route-level and browser tests for language switching and locale persistence.
- [ ] Review Thai typography, English wrapping, mobile layouts, and screen reader labels.
- [ ] Document translation ownership and the release checklist.

## Required Checks

Run these from the repository root before marking a phase complete:

```powershell
bun run i18n:audit
bun run test -- src/i18n/__tests__/i18n.test.ts
bun run build
```

## Handoff Notes

1. Read this file and `src/i18n/index.ts` before changing UI copy.
2. Add matching Thai and English keys in the same change.
3. Prefer `t(language, namespace, key, params)` in Astro/server code and `useI18n()` in React islands.
4. Do not translate user-generated or merchant-entered text automatically.
5. Update the relevant checkbox and commit the roadmap with the implementation.
