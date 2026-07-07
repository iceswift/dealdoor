# DealDoor UX/UI Release Plan

Updated: 2026-07-05  
Project: DealDoor (ดีลไหนดี)  
Focus: หน้า Home, Explore, Shop Page, Dashboard และ flow การ์ดดีล/โพสต์

## สรุปสถานะล่าสุด

DealDoor ถูกปรับจากหน้า Explore แบบ list/filter เป็นระบบ Pin Map แล้ว โดยใช้ Leaflet + OpenStreetMap เพื่อให้ต้นทุนแผนที่เป็น 0 บาทในระยะเริ่มต้น และยังคงมีการ์ดดีลแบบ Universal Design ใช้ร่วมกันใน Home, Explore และ Shop Page

งานที่ทำแล้ว:

- หน้า `/explore` เป็น Pin Map พร้อม list/map layout
- มี search, category filter, urgent filter, open-now filter, coupon filter, sort และ radius filter
- ปุ่ม `ใกล้ฉัน` ใช้ browser geolocation เฉพาะตอนผู้ใช้กด ไม่บันทึกตำแหน่งผู้ใช้
- Map popup และ selected card แสดงชื่อร้าน, หมวด, เวลาเปิดปิด, ดีลเด่น, ปุ่มดูดีล, เปิดร้าน, นำทาง
- Dashboard เพิ่มข้อมูลร้านที่ Explore ต้องใช้ เช่น พิกัด, เวลาเปิดปิด, การชำระเงิน, การเดินทาง, accessibility, pet/family notes
- Dashboard เพิ่ม card “ความพร้อมของร้านบน Explore” เพื่อบอกว่าร้านยังขาดข้อมูลอะไร
- แก้ปัญหา service worker/cache ที่ทำให้ browser เห็น UI เก่าและตัวอักษรเพี้ยน
- ตั้ง `astro.config.mjs` ให้ standalone server ใช้ port `4321` ตามคู่มือ QA

## Product Principle

ลูกค้าควรเข้าใจดีลหนึ่งใบภายใน 3 วินาที:

1. ได้ประโยชน์อะไร
2. ใช้กับร้านไหน
3. หมดอายุเมื่อไร
4. ต้องทำอะไรเพื่อรับสิทธิ์
5. มีเงื่อนไขสำคัญอะไร

ร้านค้าควรสร้างข้อมูลครั้งเดียว แล้วระบบเอาไปแสดงได้ถูกต้องทั้ง Home, Explore, Shop Page, direct deal link และ share preview

## Universal Deal Card Contract

ทุกการ์ดดีลควรยึดข้อมูลชุดเดียวกัน แต่ลด/เพิ่มรายละเอียดตาม context

### Feed/Home/Explore Card

ต้องแสดง:

- รูปดีล หรือ fallback เป็นรูปปก/โลโก้ร้าน
- หมวดดีลหรือหมวดร้าน
- ชื่อดีล
- discount text หรือ benefit หลัก
- ชื่อร้าน
- พื้นที่/ที่อยู่ย่อ
- วันหมดอายุหรือ badge ใกล้หมด
- CTA ชัดเจน เช่น `ดูดีล`

ไม่ควรยัด:

- เงื่อนไขยาว
- รายละเอียดเต็ม
- ปุ่มหลายปุ่มเกินไป

### Shop Page Deal Card

ต้องแสดง:

- ชื่อดีล
- short description
- discount text
- countdown/end date
- claim type
- primary action ตาม claim type
- secondary actions เช่น save/share/detail

### Deal Detail

ต้องแสดง:

- รูปใหญ่
- title, discount, category
- active/expired state
- start/end date
- short description และรายละเอียดเต็ม
- conditions
- redeem instructions หรือ coupon code
- ปุ่ม copy/show/contact/open LINE
- ข้อมูลร้านแบบย่อพร้อม map/phone/LINE

## Explore Release Checklist

### Done

- Pin Map จาก OSM/Leaflet
- Marker + popup + selected card
- Mobile list/map toggle
- Search/filter/sort/radius URL state
- Browser geolocation แบบ user-triggered
- Empty state และปุ่มล้างตัวกรอง
- Tap targets สำคัญใน popup/bottom sheet อย่างน้อย 44px
- Dashboard readiness score สำหรับข้อมูลร้าน
- Service worker cache version ใหม่

### Remaining Before Release

1. เพิ่มข้อมูล seed ให้ครบทุกร้าน:
   - latitude/longitude
   - opening hours
   - contact อย่างน้อย 1 ช่องทาง
   - cover/logo
   - payment/accessibility/parking notes

2. เพิ่ม merchant data quality enforcement:
   - ถ้าร้านไม่มีพิกัด ให้ขึ้น warning ใน Dashboard
   - ถ้าร้านไม่มี contact ให้ขึ้น warning ก่อน publish
   - ถ้าร้านไม่มีรูป ให้ fallback ต้องดูดี ไม่แตก layout

3. เพิ่ม direct deal QA:
   - `/deal/[id]`
   - `/{shopSlug}?deal={dealId}`
   - share/copy/save/report tracking

4. Mobile QA:
   - 320px, 375px, 390px, 430px
   - ไม่มี horizontal overflow ยกเว้น chip row ที่ตั้งใจให้ scroll
   - bottom sheet ไม่ทับ CTA สำคัญ

5. Accessibility:
   - icon-only button ต้องมี aria-label
   - modal/bottom sheet ต้องปิดด้วย Escape ใน phase ถัดไป
   - focus state ต้องเห็นชัด

## Dashboard Release Checklist

### Done

- เพิ่ม field ที่ Explore ต้องใช้
- เพิ่ม readiness card
- Live preview sync กับ form state
- ล้าง mojibake ใน ShopFormWrapper

### Remaining

- เพิ่ม dirty/saved state ต่อ section
- เพิ่ม validation warning แบบไม่ block สำหรับ optional quality fields
- เพิ่ม “คัดลอกพิกัดจาก Google Maps” helper ที่เข้าใจง่ายกว่านี้
- เพิ่ม preview ว่า card บน Explore จะหน้าตาอย่างไร
- เพิ่ม warning ถ้าแก้ข้อมูลแล้วออกจากหน้าโดยยังไม่บันทึก

## QA Checklist

- `pnpm build` ต้องผ่าน
- `node dist/server/entry.mjs` ต้องเปิดที่ `http://localhost:4321`
- `/explore` ต้องไม่มีตัวอักษรเพี้ยน
- `/dashboard` ต้องเห็น “ความพร้อมของร้านบน Explore”
- กด filter แล้ว URL query ต้อง sync
- กด “ใกล้ฉัน” แล้ว browser ขอ permission เท่านั้น ไม่ขอเองตอนโหลดหน้า
- กด marker/list card แล้ว map focus + selected card แสดงถูก
- กดล้างตัวกรองจาก empty state แล้วผลลัพธ์กลับมา
- Refresh แล้ว theme/cache ไม่ทำให้ UI เก่ากลับมา

## Next Phase

Phase ถัดไปควรทำ Direct Deal QA และ publish guard:

- ตรวจ `/deal/[id]` ให้เป็น single source of truth ของโพสต์ดีล
- เชื่อม Dashboard ให้ร้านรู้ว่าดีลไหนพร้อม publish
- เพิ่ม preview card ของดีลก่อน publish
- เพิ่ม seed data ให้ทุก scenario มีข้อมูลครบพอสำหรับ QA
