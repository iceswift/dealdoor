# DealDoor UX/UI Scan & Improvement Ideas

Scan date: 2026-07-03  
Project: DealDoor (ดีลไหนดี)  
Reviewed routes: `/`, `/explore`, `/moon-bowl-cafe`, `/auth/login`, `/dashboard`, `/pricing`, `/saved`, `/admin/monitor`  
Viewport checks: desktop 1280px, mobile 375px

## Quick Summary

DealDoor already has a clear product direction: one shareable page for local shop promotions, with strong dark-mode branding and consistent orange CTAs. The next UX step should be less about adding decoration and more about making the app easier to trust, scan, and use on mobile.

Top opportunities:

1. Fix mobile horizontal overflow on Explore, Shop Page, and Dashboard.
2. Increase tap targets to at least 44px for header icons, category chips, contact pills, saved remove buttons, footer links, and dashboard controls.
3. Make deal actions more obvious: save, share, copy coupon, contact, and show-at-shop should feel like primary user flows.
4. Reduce visual heaviness in the dark theme so content, not the background, carries the page.
5. Improve unauthenticated/authenticated navigation states so public users see the correct CTA and logged-in merchants understand where they are.
6. Move script/JSON-LD output out of readable page content if assistive tech or snapshots can see it.

## What Works Well

- Brand is memorable: the dark background, coral/orange CTA, and shop-card concept feel distinct.
- The product value is clear on the landing page: create a promotion page, share one link, expire deals automatically.
- The shop page already has the right building blocks: cover image, logo, status, category, address, map/LINE/phone/social buttons, follow/report, active and expired deals.
- Explore is easy to understand with search, category filters, urgent deals, and all deals.
- Dashboard has the expected merchant tools: shop form, deal management, analytics, QR, preview, upgrade prompt.
- Pricing is simple and understandable.

## Priority Fixes

### P0 - Mobile Layout Containment

Observed at 375px:

- `/explore` document width expands to about 600px.
- `/moon-bowl-cafe` document width expands to about 600px.
- `/dashboard` document width expands to about 600px and visible content is clipped on the right.

Recommended fixes:

- Audit any `min-w-*`, `w-[600px]`, large cards, tab bars, category rows, and dashboard banners.
- Wrap horizontal chip rows in a real scroll container with `overflow-x-auto` and ensure the parent remains `max-w-full`.
- Add `min-w-0` to flex children that contain long Thai/English text.
- Use `max-w-full overflow-hidden` on cards, hero images, dashboard panels, and pricing blocks.
- Re-test at 320px, 375px, 390px, 430px, and desktop.

### P0 - Tap Target Size

Several visible controls are under 44px high/wide:

- Header logo link: 36px high.
- Mobile menu button: 38px.
- Desktop saved/theme/logout icon buttons: around 38px.
- Explore category chips: 36px.
- Shop contact pills: 30px.
- Saved remove `x` buttons: about 11x20px.
- Footer links: 20px high.
- Dashboard theme buttons: around 35x32px.

Recommended fixes:

- Create a shared `.tap-target` rule and apply it to all icon-only and pill controls.
- Keep visual pills compact if desired, but use padding or invisible hit area to reach 44px.
- For destructive small buttons such as saved remove, use a real 44x44 icon button with a hover/focus background.

### P0 - Public Navigation State

Current session showed `Dashboard` and `Logout` in the public header. That is correct for a logged-in merchant, but the UX should make the state explicit.

Ideas:

- Logged out: primary CTA should be `เข้าสู่ระบบ` or `เริ่มใช้ฟรี`.
- Logged in merchant: show a small account/shop label near Dashboard, not only a logout icon.
- Consider hiding merchant-only actions from consumer-first pages like Explore unless the user opens the account menu.
- Add a compact account menu with Dashboard, Saved, Theme, Logout.

### P1 - Deal Card Action Hierarchy

The shop page has the right actions, but users need faster clarity:

- Primary action: use/redeem deal or copy coupon.
- Secondary actions: save and share.
- Context actions: conditions, expiry, shop contact.

Ideas:

- On each active deal card, place the discount/title, expiry, and primary action in a clear top-to-bottom scan path.
- Use a sticky bottom action area inside the deal detail modal: `คัดลอกโค้ด`, `บันทึก`, `แชร์`.
- After copy/save/share, show a toast with plain feedback and undo where relevant.
- Expired deals should be visually quieter but still readable, with a clear reason: `หมดอายุแล้วเมื่อ ...`.

### P1 - Explore Discovery

Explore currently feels clean, but the mobile category row causes overflow and the first result area is sparse on desktop.

Ideas:

- Keep category chips horizontally scrollable only inside the chip row, not the page.
- Add selected filter state that is visually stronger than just orange fill, such as check/icon plus active label.
- Add sort controls: `ใกล้หมดอายุ`, `ใหม่ล่าสุด`, `ใกล้ฉัน`, `ยอดนิยม`.
- Add lightweight metadata to cards: shop category, distance/area, expiry, discount type.
- Add empty-state suggestions: clear filters, view all categories, or try popular searches.

### P1 - Dashboard Mobile Usability

Dashboard is the highest-risk screen on mobile because merchants will manage real content there.

Ideas:

- Convert top dashboard tabs into a segmented horizontal scroll with visible edge fade and no page overflow.
- Make primary actions persistent near the top: `เพิ่มดีล`, `ดูหน้าร้าน`, `แชร์ลิงก์`.
- Split the shop form into sections with save status per section: Basic Info, Contact, Location, Branding.
- Show live preview beside the form on desktop and below each section on mobile.
- Use clearer upload states: empty, uploading, uploaded, error, replace/remove.

### P1 - Theme & Visual Weight

The dark theme is stylish, but many screens rely on the same dark glass/orange treatment. This can make functional pages feel heavy and reduce content contrast.

Ideas:

- Keep the dark theme, but use calmer surfaces for operational pages like Dashboard.
- Reserve strong gradients for primary CTAs and key upgrade/promo moments.
- Use real shop/deal imagery more often; current placeholder/initial avatars make sample shops feel less trustworthy.
- Reduce large empty vertical gaps above cards on desktop Explore/Saved.
- Make light mode equally polished, not just a secondary mode.

### P1 - Accessibility & Semantics

Route snapshots included inline script/JSON-LD text in readable page content on some pages. If screen readers or crawlers encounter this as body text, it will be confusing.

Ideas:

- Ensure JSON-LD uses `<script type="application/ld+json">` in the document head or otherwise hidden from accessible reading.
- Ensure Astro inline scripts do not render as text nodes inside main content.
- Add accessible names to icon-only nav items in Thai and English where applicable.
- Replace emoji headings/icons in production UI with consistent SVG icons.
- Ensure modals trap focus, close with Escape, and restore focus to the triggering button.

## Page-by-Page Ideas

### Landing `/`

Current impression: strong brand and clear CTA, but the first viewport is very dark and centered.

Improvements:

- Show a realistic mini preview of a shop promotion page in the hero, especially on desktop.
- Make the secondary CTA less visually heavy than the primary CTA.
- Add one merchant trust proof above the fold: sample QR, example shop, or "ใช้ได้ฟรี".
- On mobile, keep both CTAs at 44px height and avoid disabled-looking low contrast on the secondary button.

### Explore `/explore`

Current impression: understandable discovery page with search and chips.

Improvements:

- Fix horizontal overflow from chips/cards.
- Add sort and quick filters.
- Show deal count near active filter and search result state.
- Make deal cards more image-led or shop-led so users can recognize local places quickly.
- Add saved/favorite action directly on cards if not already visible lower on the page.

### Shop Page `/moon-bowl-cafe`

Current impression: visually polished shop profile, but contact pills are small and the important deal list starts below the first fold.

Improvements:

- Bring the first active deal slightly higher on mobile.
- Increase contact pill height to at least 44px.
- Make the mobile sticky contact bar visually distinct from the page background and account for safe-area bottom padding.
- Add "Open now / closed" and hours summary near the status badge.
- Give report a quieter location, but keep it accessible.
- Use actual shop cover/logo images where possible; placeholder gradients reduce merchant trust.

### Login `/auth/login`

Current authenticated session redirected directly to `/dashboard`, which is good if intentional.

Improvements:

- Logged-in users who visit login should see a brief redirect or "You are already logged in" state if redirect takes time.
- Add password visibility toggle.
- Add forgot password placeholder or support contact if reset is not implemented.
- Use one clear post-login promise: `เข้าสู่แดชบอร์ดร้านค้า`.

### Dashboard `/dashboard`

Current impression: feature-rich but crowded on mobile and visually clipped.

Improvements:

- Fix mobile overflow first.
- Make the dashboard header less tall and less fragmented on mobile.
- Replace icon-only dashboard utilities with a compact account/actions menu.
- Add form dirty-state: saved, unsaved changes, saving, error.
- Put QR/share link in a persistent "Share shop" module near the top.
- Add a preview card that shows what customers will see after edits.

### Pricing `/pricing`

Current impression: clean comparison and clear coming-soon modal.

Improvements:

- Make Free vs Pro benefits more outcome-based, not only limits.
- Add "Best for" copy: new shop, active campaign shop.
- Since payment is not implemented, make the Pro CTA say `แจ้งเตือนเมื่อเปิดใช้` or `ติดต่อเพื่ออัปเกรด` instead of a hard upgrade button.
- Keep the coming-soon modal accessible with focus trap and Escape close.

### Saved `/saved`

Current impression: simple and useful, but remove controls are too small.

Improvements:

- Increase remove buttons to 44x44.
- Add expiry/status to saved cards so users know urgency.
- Add grouping by shop or expiry date.
- Add a confirm/undo toast after removal.
- Empty states should suggest categories or recent popular deals.

### Admin `/admin/monitor`

Current impression: functional monitor, but mostly developer-oriented.

Improvements:

- If this is only for admins, hide normal consumer nav or add an admin label.
- Add status color coding for system health.
- Add "last refreshed" timestamp.
- Keep English if admin-only is internal, but be consistent if Thai merchants may see it.

## Suggested Ticket Order

1. Mobile overflow audit and fixes for Explore, Shop Page, Dashboard.
2. Global tap-target pass with a shared utility.
3. Header/account navigation cleanup for logged-in vs logged-out users.
4. Shop deal card action hierarchy improvements.
5. Dashboard mobile layout and form save-state improvements.
6. Accessibility cleanup for scripts/JSON-LD, modals, icon labels, and focus.
7. Visual trust pass: real images, less placeholder UI, calmer operational pages.
8. Explore sorting/filtering and stronger empty states.

## QA Regression Checklist

- At 375px, no page should horizontally scroll except intentional inner chip/tab rows.
- All visible buttons, links, chips, and icon buttons should have at least a 44x44 touch area.
- Header should show the correct state for logged-in and logged-out users.
- Search and category filters should update result counts and empty states.
- Copy coupon, save, share, and report should provide visible feedback.
- Mobile sticky contact bar should not cover deal actions or footer content.
- Dashboard tabs and forms should be usable without clipping.
- Theme should persist after refresh and all text should remain readable in both modes.
- Keyboard users should be able to open/close menus, modals, and share menus.
- Screen readers should not encounter script or JSON-LD content as visible page text.

