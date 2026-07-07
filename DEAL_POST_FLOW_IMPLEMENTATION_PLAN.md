# DealDoor Deal/Post Flow Implementation Plan

Updated: 2026-07-05

## Goal

ทำให้ “โพสต์ดีล” เป็นระบบเดียวกันตั้งแต่ร้านค้าสร้างดีลใน Dashboard จนลูกค้าเห็นบน Home, Explore, Shop Page, direct deal page และ share link

## Core Contract

ดีลหนึ่งรายการต้องมีข้อมูลพอสำหรับ 4 context:

1. Card แบบสั้นใน Home/Explore
2. Card ใน Shop Page
3. Detail modal/page
4. Share/SEO preview

ข้อมูลสำคัญ:

- `title`
- `shortDescription`
- `description`
- `discountText`
- `conditions`
- `couponCode`
- `claimType`
- `imageUrl`
- `startDate`
- `endDate`
- `isActive`
- shop name/category/address/contact/location

## Routing Contract

รองรับทั้งสองรูปแบบ:

- Direct deal: `/deal/[id]`
- Shop deep link: `/{shopSlug}?deal={dealId}`

พฤติกรรมที่ต้องมี:

- กดจาก card แล้วไปถึงดีลที่ถูกต้อง
- ถ้าเปิด shop deep link ต้อง highlight/open deal นั้น
- ถ้า deal ไม่พบ ต้อง fallback กลับหน้า shop พร้อมข้อความที่เข้าใจได้
- share link ต้องใช้ title/description/image ของ deal ก่อน shop

## Phase Status

### Phase 1: Universal Card Foundation

Status: Done

- ใช้ card design เดียวกันระหว่าง Home, Explore, Shop Page
- การ์ดแสดงรูป ดีล ร้าน ส่วนลด วันหมดอายุ และ CTA
- ลดความต่างของ card เมื่อกดจากหน้าแรกไปหน้าดีล/ร้าน

### Phase 2: Explore Pin Map

Status: Done

- เปลี่ยน `/explore` เป็น Pin Map
- ใช้ Leaflet + OpenStreetMap ต้นทุน 0 บาท
- มี list/map layout, marker, popup, selected pin card
- มี search, category, urgent, open-now, coupon, sort, radius
- `ใกล้ฉัน` ใช้ browser geolocation เมื่อผู้ใช้กดเท่านั้น

### Phase 3: Dashboard Data Completeness

Status: Done

- เพิ่ม field ร้านที่ Explore ต้องใช้
- เพิ่ม readiness score ใน Dashboard
- บอก merchant ว่าขาดข้อมูลอะไร เช่น พิกัด เวลาเปิดปิด ช่องทางติดต่อ รูปภาพ
- Live preview sync กับ form

### Phase 4: Release Hardening

Status: In progress

Done:

- ปรับ service worker cache version เพื่อไม่ให้ UI เก่าค้าง
- ตั้ง standalone server ให้ใช้ port 4321
- เพิ่ม empty-state reset ใน Explore
- เพิ่ม tap target ของ map popup/bottom sheet

Remaining:

- smoke test ทุกหน้าใน QA list
- ตรวจ mobile overflow 320/375/390/430px
- ตรวจ direct deal page และ shop deep link
- เพิ่ม seed data ให้ครบทุก scenario
- ตรวจ accessibility ของ modal/share/report

## Dashboard Publish Guard

ควรเพิ่ม rule ก่อนให้ร้าน publish/ขึ้น Explore:

Required for Explore pin:

- shop name
- category
- address
- latitude + longitude
- opening hours
- at least one contact channel

Recommended:

- cover image
- logo image
- payment methods
- parking/accessibility notes
- family/pet notes ถ้าเกี่ยวข้อง

Required for deal quality:

- title
- discountText
- shortDescription
- endDate
- claimType

Recommended:

- imageUrl
- description
- conditions
- couponCode หรือ redeem instructions

## QA Scenarios

Authentication:

- Login redirects to `/dashboard`
- Logout works
- Dashboard redirects to login when not authenticated

Explore:

- Search filters map pins and cards
- Category chips update URL
- Empty state reset restores results
- `ใกล้ฉัน` requests location only after click
- Radius filter warns if location is not enabled
- Marker click opens popup and selected card
- Mobile card click switches to map and opens bottom sheet

Shop/Deal:

- Active deals show countdown
- Expired deals look disabled but readable
- Coupon copy works
- Share menu works
- Save/favorite works
- Report modal opens
- Contact links work

Dashboard:

- Shop form saves all Explore fields
- Readiness score updates while editing
- Deal CRUD works
- QR code generates
- Share link copies

## Next Build Task

ทำ Direct Deal Release Pass:

1. ตรวจ `/deal/[id]` UI และ metadata
2. ตรวจ `/{shopSlug}?deal={dealId}` highlight/open behavior
3. เพิ่ม fallback ถ้า deal id ไม่พบ
4. เพิ่ม Dashboard preview ของ Explore card + Detail page
5. เพิ่ม seed data สำหรับร้านที่มี/ไม่มีพิกัด เพื่อ QA map behavior
