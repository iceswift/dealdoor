# DealDoor — UI/UX Design Document

---

## 1. Design Principles

| Principle | Description |
|-----------|-------------|
| Mobile-first | Design for 375px width first, scale up |
| Fast and clear | Answer customer questions within seconds |
| Merchant simple | Non-technical shop owners can use it |
| Deal clarity | Every deal shows what, when, conditions, action |
| Trust | Shop name, location, contact, clear conditions |
| Shareable | Every page and deal feels natural to share |

---

## 2. Color System

### Primary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#FF6B35` | CTA buttons, active states, brand accent |
| `primary-dark` | `#E55A2B` | Hover state |
| `primary-light` | `#FFF0EB` | Background tint, badges |

### Secondary Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary` | `#1A1A2E` | Headings, text |
| `secondary-light` | `#2D2D44` | Subheadings |

### Neutral Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#FFFFFF` | Page background |
| `bg-secondary` | `#F7F7F8` | Card background, sections |
| `bg-tertiary` | `#EFEFEF` | Dividers, borders |
| `text-primary` | `#1A1A1A` | Main text |
| `text-secondary` | `#6B6B6B` | Descriptions, meta |
| `text-tertiary` | `#9B9B9B` | Disabled, hints |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#10B981` | Active deals, open status |
| `warning` | `#F59E0B` | Expiring soon badge |
| `danger` | `#EF4444` | Expired deals, errors |
| `info` | `#3B82F6` | Info badges, links |

### Deal Category Colors

| Category | Hex | Badge Style |
|----------|-----|-------------|
| Birthday | `#EC4899` | Pink |
| Monthly | `#8B5CF6` | Purple |
| Festival | `#F59E0B` | Amber |
| Special Day | `#EF4444` | Red |
| Senior | `#6366F1` | Indigo |
| Kids | `#14B8A6` | Teal |
| Student | `#3B82F6` | Blue |
| Flash | `#F97316` | Orange |

---

## 3. Typography

### Font Stack

```css
font-family: 'Inter', 'Noto Sans Thai', system-ui, sans-serif;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | 32px | 700 | 1.2 | Hero headlines |
| `h1` | 24px | 700 | 1.3 | Page titles |
| `h2` | 20px | 600 | 1.4 | Section titles |
| `h3` | 16px | 600 | 1.4 | Card titles |
| `body` | 14px | 400 | 1.5 | Main text |
| `body-sm` | 13px | 400 | 1.5 | Descriptions |
| `caption` | 12px | 400 | 1.4 | Meta text, badges |
| `tiny` | 11px | 500 | 1.3 | Labels, tags |

---

## 4. Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps |
| `sm` | 8px | Inner padding |
| `md` | 12px | Card padding |
| `lg` | 16px | Section gaps |
| `xl` | 24px | Page padding |
| `2xl` | 32px | Large sections |
| `3xl` | 48px | Page sections |

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 6px | Badges, small elements |
| `md` | 10px | Cards, inputs |
| `lg` | 14px | Modals, large cards |
| `full` | 9999px | Avatars, pills |

---

## 6. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `md` | `0 4px 12px rgba(0,0,0,0.08)` | Cards |
| `lg` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, dropdowns |

---

## 7. Page Layouts

### 7.1 Landing Page

```
┌─────────────────────────────────┐
│  DealDoor Logo    [Explore] [+] │  ← Sticky header
├─────────────────────────────────┤
│                                 │
│   สร้างหน้าโปรโมชันร้านของคุณ    │  ← Hero headline
│   แชร์ง่าย หมดอายุเอง           │
│                                 │
│   [สร้างหน้าร้าน] [ดีลใกล้ตัว]  │  ← CTAs
│                                 │
├─────────────────────────────────┤
│   ตัวอย่างร้านค้า               │  ← Sample shops
│   ┌─────┐ ┌─────┐ ┌─────┐      │
│   │Shop1│ │Shop2│ │Shop3│      │
│   └─────┘ └─────┘ └─────┘      │
├─────────────────────────────────┤
│   ทำไมต้อง DealDoor?           │  ← Features
│   ✓ สร้างง่าย  ✓ แชร์ได้ทันที  │
│   ✓ หมดอายุอัตโนมัติ           │
├─────────────────────────────────┤
│   Footer                        │
└─────────────────────────────────┘
```

### 7.2 Public Shop Page (Core)

```
┌─────────────────────────────────┐
│  ← Back          [Share] [Copy] │  ← Top bar
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │     Cover Image             ││  ← Shop header
│  │  ┌───┐                      ││
│  │  │LOG│  Moon Bowl Cafe      ││
│  │  └───┘  Cafe / Dessert      ││
│  │         📍 Bangkok           ││
│  │         ⏰ Open now          ││
│  └─────────────────────────────┘│
│                                 │
│  [Map] [LINE] [Call] [Facebook] │  ← Contact buttons
│                                 │
├─────────────────────────────────┤
│  🔥 โปรโมชันตอนนี้ (4)          │  ← Active deals
│  ┌─────────────────────────────┐│
│  │ 🎂 Birthday Month Free      ││  ← Deal card
│  │    Brownie                  ││
│  │ ฟรีบราวนี่ เมื่อสั่งเครื่องดื่ม│
│  │ ⏰ หมดอายุ: 31 ก.ค. 68      ││
│  │ [คัดลอกโค้ด] [แชร์]         ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🎓 Student 10% Off          ││  ← Deal card
│  │    ...                      ││
│  └─────────────────────────────┘│
│  ... more deals ...             │
│                                 │
├─────────────────────────────────┤
│  📋 เมนู / แคตตาล็อก           │  ← Menu section
│  ┌─────────┐ Name              │
│  │  Image  │ ฿120              │
│  └─────────┘ Description       │
│  ... more items ...             │
│                                 │
├─────────────────────────────────┤
│  📍 ข้อมูลร้าน                 │  ← Shop info
│  Address: ...                   │
│  Hours: ...                     │
│  Phone: ...                     │
│  ┌─────────────────────────────┐│
│  │     Map Preview             ││
│  └─────────────────────────────┘│
│                                 │
│  [LINE] [Facebook] [IG] [Web]  │
│                                 │
├─────────────────────────────────┤
│  สร้างโดย DealDoor             │  ← Footer CTA
│  [สร้างหน้าร้านของคุณ]          │
└─────────────────────────────────┘
```

### 7.3 Deal Detail Modal

```
┌─────────────────────────────────┐
│  ✕                               │
├─────────────────────────────────┤
│  🎂 Birthday Month Free Brownie │
│  หมวด: Birthday                  │
│                                 │
│  ฟรีบราวนี่ 1 ชิ้น เมื่อสั่ง      │
│  เครื่องดื่มใดก็ได้ 1 แก้ว       │
│                                 │
│  ⏰ หมดอายุ: 31 กรกฎาคม 2568    │
│  ⚠️ เหลืออีก 5 วัน              │
│                                 │
│  เงื่อนไข:                       │
│  • ลูกค้า 1 ท่าน / 1 สิทธิ์     │
│  • แสดงโค้ดที่ร้าน              │
│                                 │
│  โค้ด: MOONBDAY2025             │
│  [📋 คัดลอกโค้ด]                │
│                                 │
│  [📍 เปิดแผนที่] [💬 ติดต่อร้าน] │
│  [📤 แชร์ดีลนี้]                │
└─────────────────────────────────┘
```

### 7.4 Explore Page

```
┌─────────────────────────────────┐
│  DealDoor    [🔍 Search...]     │
├─────────────────────────────────┤
│  [ทั้งหมด] [อาหาร] [คาเฟ่]      │  ← Category chips
│  [ความงาม] [บริการ] [ช้อป]      │
│                                 │
│  ⏰ ดีลใกล้หมดอายุ             │  ← Expiring soon
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Deal1│ │Deal2│ │Deal3│      │
│  └─────┘ └─────┘ └─────┘      │
│                                 │
│  🔥 ดีลยอดนิยม                 │  ← Popular deals
│  ┌─────────────────────────────┐│
│  │ Shop Name — Deal Title      ││
│  │ 📍 Location  ⏰ Expires     ││
│  └─────────────────────────────┘│
│  ... more cards ...             │
│                                 │
│  📍 แผนที่ (placeholder)        │  ← Map section
│  ┌─────────────────────────────┐│
│  │                             ││
│  │     [Map Placeholder]       ││
│  │                             ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### 7.5 Merchant Dashboard

```
┌─────────────────────────────────┐
│  DealDoor Dashboard   [Preview] │
├─────────────────────────────────┤
│  [ข้อมูลร้าน] [ดีล] [เมนู]     │  ← Tabs
├─────────────────────────────────┤
│                                 │
│  ข้อมูลร้าน                     │
│  ┌─────────────────────────────┐│
│  │ ชื่อร้าน: [______________]  ││
│  │ ประเภทร้าน: [___________]   ││
│  │ คำอธิบาย: [_____________]   ││
│  │ ที่อยู่: [_______________]   ││
│  │ เบอร์โทร: [_____________]   ││
│  │ LINE: [_________________]   ││
│  │ Facebook: [_____________]   ││
│  │ Instagram: [____________]   ││
│  └─────────────────────────────┘│
│                                 │
│  จัดการดีล (3/6)                │
│  [+ เพิ่มดีล]                   │
│  ┌─────────────────────────────┐│
│  │ Deal 1  [Edit] [Delete]     ││
│  │ Deal 2  [Edit] [Delete]     ││
│  │ Deal 3  [Edit] [Delete]     ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🔗 ลิงก์หน้าร้าน:           ││
│  │ dealdoor.co/moon-bowl-cafe  ││
│  │ [📋 คัดลอกลิงก์]            ││
│  └─────────────────────────────┘│
│                                 │
│  [⬆️ อัปเกรดเป็น Pro]          │  ← Upgrade CTA
└─────────────────────────────────┘
```

---

## 8. Component Specifications

### 8.1 Deal Card

```
┌─────────────────────────────────┐
│ [Category Badge]    [⏰ 5วัน]   │
│ Deal Title                      │
│ Short description text here...  │
│                                 │
│ ฿ส่วนลด / ผลประโยชน์           │
│                                 │
│ [คัดลอกโค้ด]       [แชร์]      │
└─────────────────────────────────┘
```

**States:**
- Active: Normal appearance
- Expiring Soon: Yellow warning badge, countdown
- Expired: Grayed out, "หมดอายุแล้ว" overlay

### 8.2 Contact Button

```
┌────────────────┐
│  [Icon] Label  │
└────────────────┘
```

**Variants:**
- Map: Blue, opens Google Maps
- LINE: Green, opens LINE link
- Call: Gray, initiates phone call
- Facebook: Blue, opens FB page
- Instagram: Pink, opens IG profile
- Share: Gray, triggers share dialog

### 8.3 Countdown Badge

```
┌─────────────────┐
│ ⏰ เหลือ 5 วัน  │
└─────────────────┘
```

**States:**
- More than 7 days: Neutral gray
- 3-7 days: Warning yellow
- Less than 3 days: Urgent orange
- Less than 24 hours: "หมดอายุวันนี้" red
- Expired: "หมดอายุแล้ว" gray

### 8.4 Shop Header

```
┌─────────────────────────────────┐
│  ┌─────────────────────────────┐│
│  │                             ││
│  │       Cover Image           ││
│  │                             ││
│  │  ┌─────┐                    ││
│  │  │Logo │                    ││
│  │  └─────┘                    ││
│  └─────────────────────────────┘│
│                                 │
│  Shop Name                      │
│  Category · Location            │
│  ⏰ Open now · 📍 0.5 km       │
│                                 │
│  Short description text...      │
│                                 │
│  [Map] [LINE] [Call] [More]    │
└─────────────────────────────────┘
```

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, full width |
| Tablet | 640-1024px | 2-column grid for cards |
| Desktop | > 1024px | Max-width 480px centered for shop page |

**Note:** Shop page stays narrow (max 480px) even on desktop since it's designed to be viewed from mobile shared links. Dashboard can expand wider.

---

## 10. Interaction Patterns

### 10.1 Share Flow
```
User clicks [Share] →
  ├── Copy link (default, instant toast)
  ├── Share to LINE (deep link)
  ├── Share to Facebook (sharer URL)
  ├── Share to Instagram (copy + toast)
  └── More options (Web Share API)
```

### 10.2 Deal Claim Flow
```
User clicks [คัดลอกโค้ด] →
  ├── Copy coupon code to clipboard
  ├── Show toast "คัดลอกโค้ดแล้ว!"
  └── Button changes to "✓ คัดลอกแล้ว"
```

### 10.3 Map Flow
```
User clicks [เปิดแผนที่] →
  └── Open Google Maps with shop coordinates
```

### 10.4 Contact Flow
```
User clicks [LINE] → Open LINE deep link
User clicks [โทร] → Initiate tel: protocol
User clicks [Facebook] → Open FB page URL
```

---

## 11. Animations & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transition | Fade in | 200ms |
| Deal card hover | Scale 1.02, shadow lift | 150ms |
| Modal open | Slide up + fade | 250ms |
| Modal close | Fade out | 200ms |
| Toast notification | Slide down from top | 300ms |
| Badge pulse | Gentle scale pulse | 1.5s infinite |
| Button press | Scale 0.98 | 100ms |

---

## 12. Empty States

### No Deals Yet
```
┌─────────────────────────────────┐
│                                 │
│        📋                       │
│   ยังไม่มีโปรโมชัน              │
│   ร้านนี้ยังไม่ได้เพิ่มดีล      │
│                                 │
└─────────────────────────────────┘
```

### No Search Results
```
┌─────────────────────────────────┐
│                                 │
│        🔍                       │
│   ไม่พบผลลัพธ์                  │
│   ลองค้นหาด้วยคำอื่น            │
│                                 │
└─────────────────────────────────┘
```

---

## 13. Loading States

### Skeleton Loader
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │ ████████████████████████████│ │  ← Cover skeleton
│ └─────────────────────────────┘ │
│ ████████████  ████████████████  │  ← Text skeleton
│ ████████████████████████████████│
│                                 │
│ ████████████████████████████████│  ← Card skeleton
│ ████████████████████████████████│
└─────────────────────────────────┘
```

---

## 14. Onboarding Wizard Wireframes

### 14.1 Progress Indicator

```
┌─────────────────────────────────┐
│  ●───●───○  ขั้นตอน 2/3         │
│  1   2   3                       │
└─────────────────────────────────┘
```

### 14.2 Step 1: Shop Setup

```
┌─────────────────────────────────┐
│  ← Back          ขั้นตอน 1/3    │
├─────────────────────────────────┤
│                                 │
│   ตั้งค่าร้านของคุณ             │
│                                 │
│   ชื่อร้าน *                    │
│   ┌─────────────────────────────┐│
│   │ Moon Bowl Cafe              ││
│   └─────────────────────────────┘│
│                                 │
│   ประเภทร้าน *                  │
│   ┌─────────────────────────────┐│
│   │ เลือกประเภท          ▼     ││
│   └─────────────────────────────┘│
│   [คาเฟ่] [ร้านอาหาร] [ความงาม] │
│                                 │
│   เบอร์โทร                      │
│   ┌─────────────────────────────┐│
│   │ 081-234-5678                ││
│   └─────────────────────────────┘│
│                                 │
│   LINE ID                       │
│   ┌─────────────────────────────┐│
│   │ @moonbowlcafe               ││
│   └─────────────────────────────┘│
│                                 │
│   [ถัดไป →]                     │
│                                 │
└─────────────────────────────────┘
```

### 14.3 Step 2: Add First Deal

```
┌─────────────────────────────────┐
│  ← Back          ขั้นตอน 2/3    │
├─────────────────────────────────┤
│                                 │
│   เพิ่มโปรโมชันแรก              │
│                                 │
│   ชื่อดีล *                     │
│   ┌─────────────────────────────┐│
│   │ Birthday Free Brownie       ││
│   └─────────────────────────────┘│
│                                 │
│   หมวดหมู่ *                    │
│   [🎂 Birthday] [📅 รายเดือน]   │
│   [🎓 นักเรียน] [👴 ผู้สูงอายุ] │
│   [⚡ Flash] [✨ อื่นๆ]         │
│                                 │
│   ส่วนลด / ผลประโยชน์ *        │
│   ┌─────────────────────────────┐│
│   │ ฟรีบราวนี่ 1 ชิ้น           ││
│   └─────────────────────────────┘│
│                                 │
│   วันหมดอายุ *                  │
│   ┌─────────────────────────────┐│
│   │ 📅 31/07/2025               ││
│   └─────────────────────────────┘│
│                                 │
│   โค้ด (ถ้ามี)                  │
│   ┌─────────────────────────────┐│
│   │ MOONBDAY2025                ││
│   └─────────────────────────────┘│
│                                 │
│   [+ เพิ่มดีลอีก] [ถัดไป →]    │
│                                 │
│   หรือเลือกเทมเพลต:            │
│   [🎂 Birthday] [📅 Monthly]    │
│   [🎓 Student] [⚡ Flash]       │
│                                 │
└─────────────────────────────────┘
```

### 14.4 Step 3: Preview & Share

```
┌─────────────────────────────────┐
│                                 │
│         🎉                      │
│   หน้าร้านของคุณพร้อมแล้ว!      │
│                                 │
│   ┌─────────────────────────────┐│
│   │                             ││
│   │   [Shop Page Preview]       ││
│   │                             ││
│   └─────────────────────────────┘│
│                                 │
│   ลิงก์หน้าร้าน:                │
│   ┌─────────────────────────────┐│
│   │ dealdoor.co/moon-bowl-cafe  ││
│   │           [📋 คัดลอก]       ││
│   └─────────────────────────────┘│
│                                 │
│   แชร์ไปที่:                    │
│   [LINE] [Facebook] [Instagram] │
│                                 │
│   [ดูแดชบอร์ด →]               │
│                                 │
└─────────────────────────────────┘
```

### 14.5 Quick Deal Templates

```
┌─────────────────────────────────┐
│   เทมเพลตดีล                    │
│                                 │
│   🎂 Birthday Deal              │
│   ฟรีขนม/ส่วนลดเดือนเกิด       │
│   [ใช้เทมเพลต]                  │
│                                 │
│   📅 Monthly Special            │
│   โปรโมชันประจำเดือน            │
│   [ใช้เทมเพลต]                  │
│                                 │
│   🎓 Student Discount           │
│   ส่วนลดนักเรียน/นักศึกษา       │
│   [ใช้เทมเพลต]                  │
│                                 │
│   ⚡ Flash Sale                  │
│   ดีลจำกัดเวลา                  │
│   [ใช้เทมเพลต]                  │
│                                 │
└─────────────────────────────────┘
```

### 14.6 Welcome Screen (Post-Onboarding)

```
┌─────────────────────────────────┐
│                                 │
│   🎉 ยินดีต้อนรับ!              │
│                                 │
│   หน้าร้านของคุณพร้อมใช้งานแล้ว │
│                                 │
│   สิ่งที่คุณทำได้ต่อ:           │
│   • เพิ่มโปรโมชัน更多            │
│   • อัปโหลดรูปปกและโลโก้       │
│   • เพิ่มเมนู/สินค้า            │
│   • แชร์ลิงก์ให้ลูกค้า          │
│                                 │
│   [ดูหน้าร้าน] [เพิ่มดีล]       │
│                                 │
└─────────────────────────────────┘
```

---

## 15. Accessibility

- All interactive elements have min 44px touch target
- Color contrast ratio ≥ 4.5:1 for text
- Focus visible states for keyboard navigation
- Alt text for all images
- Semantic HTML structure (headings, landmarks)
- Screen reader friendly labels
