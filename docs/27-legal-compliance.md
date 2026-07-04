# DealDoor — Legal & Compliance Design

---

## 1. Overview

Legal compliance protects DealDoor, merchants, and customers. Thailand's PDPA (Personal Data Protection Act) is the primary regulation.

---

## 2. Legal Pages Required

| Page | URL | Required |
|------|-----|----------|
| Terms of Service | `/terms` | Yes |
| Privacy Policy | `/privacy` | Yes |
| Cookie Policy | `/cookies` | Yes |
| Acceptable Use | `/acceptable-use` | Recommended |
| Merchant Agreement | `/merchant-terms` | Recommended |

---

## 3. PDPA Compliance (Thailand)

### 3.1 Data We Collect

| Data Type | Purpose | Legal Basis |
|-----------|---------|-------------|
| Email | Account creation, communication | Consent |
| Name | Account personalization | Consent |
| Phone | Contact, verification | Consent |
| Shop info | Display on platform | Contract |
| Deal info | Display on platform | Contract |
| IP address | Security, analytics | Legitimate interest |
| Cookies | Preferences, analytics | Consent |
| Analytics | Product improvement | Legitimate interest |

### 3.2 Consent Management

```typescript
// src/lib/consent.ts

export interface ConsentPreferences {
  necessary: boolean;      // Always true
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CONSENT_KEY = 'dealdoor_consent';

export function getConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(CONSENT_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function setConsent(preferences: ConsentPreferences): void {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences));
  
  // Apply consent
  if (preferences.analytics) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }
}

export function hasConsent(): boolean {
  return getConsent() !== null;
}
```

### 3.3 Cookie Banner

```tsx
// src/components/shared/CookieBanner.tsx

import { useState, useEffect } from 'react';
import { hasConsent, setConsent } from '../../lib/consent';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasConsent()) {
      setShow(true);
    }
  }, []);

  const handleAcceptAll = () => {
    setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
    setShow(false);
  };

  const handleRejectOptional = () => {
    setConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-4 shadow-lg">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h3 className="font-medium">🍪 เราใช้คุกกี้</h3>
            <p className="mt-1 text-sm text-gray-500">
              เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ ดูรายละเอียดใน{' '}
              <a href="/cookies" className="text-primary underline">นโยบายคุกกี้</a>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRejectOptional}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={handleAcceptAll}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
            >
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Terms of Service Template

```markdown
<!-- src/pages/terms.astro -->

# ข้อกำหนดการใช้งาน DealDoor

**วันที่มีผล:** 1 กรกฎาคม 2568

## 1. การยอมรับข้อกำหนด
การเข้าถึงและใช้งาน DealDoor ถือว่าคุณยอมรับข้อกำหนดเหล่านี้

## 2. บริการของเรา
DealDoor เป็นแพลตฟอร์มสำหรับสร้างหน้าโปรโมชันร้านค้า

## 3. บัญชีผู้ใช้
- คุณต้องให้ข้อมูลที่ถูกต้อง
- คุณรับผิดชอบต่อความปลอดภัยของบัญชี
- คุณต้องมีอายุ 18 ปีขึ้นไป

## 4. เนื้อหา
- คุณรับผิดชอบต่อเนื้อหาที่คุณโพสต์
- เนื้อหาต้องไม่ผิดกฎหมาย หลอกลวง หรือละเมิดสิทธิ์ผู้อื่น
- เราสงวนสิทธิ์ในการลบเนื้อหาที่ไม่เหมาะสม

## 5. การใช้งานที่ยอมรับได้
- ไม่ส่งสแปมหรือเนื้อหาที่เป็นอันตราย
- ไม่พยายามเข้าถึงระบบโดยไม่ได้รับอนุญาต
- ไม่ใช้บอทหรือสคริปต์อัตโนมัติ

## 6. ทรัพย์สินทางปัญญา
- DealDoor เป็นเจ้าของเครื่องหมายการค้าและโค้ด
- คุณอนุญาตให้เราแสดงเนื้อหาที่คุณโพสต์

## 7. การจำกัดความรับผิด
- DealDoor ไม่รับผิดชอบต่อความเสียหายทางอ้อม
- เราไม่รับประกันความถูกต้องของข้อมูลร้านค้า

## 8. การเปลี่ยนแปลง
เราอาจเปลี่ยนแปลงข้อกำหนดเหล่านี้ โดยจะแจ้งให้ทราบล่วงหน้า

## 9. การติดต่อ
อีเมล: legal@dealdoor.co
```

---

## 5. Privacy Policy Template

```markdown
<!-- src/pages/privacy.astro -->

# นโยบายความเป็นส่วนตัว DealDoor

**วันที่มีผล:** 1 กรกฎาคม 2568

## 1. ข้อมูลที่เราเก็บรวบรวม

### ข้อมูลที่คุณให้เรา
- ชื่อ อีเมล เบอร์โทร
- ข้อมูลร้านค้า
- ข้อมูลโปรโมชัน

### ข้อมูลที่เก็บอัตโนมัติ
- ที่อยู่ IP
- ประเภทเบราว์เซอร์
- หน้าที่เข้าชม
- คุกกี้

## 2. วิธีการใช้ข้อมูล
- ให้บริการและดูแลระบบ
- ปรับปรุงประสบการณ์ผู้ใช้
- ส่งการแจ้งเตือนและข่าวสาร
- วิเคราะห์การใช้งาน

## 3. การแบ่งปันข้อมูล
- เราไม่ขายข้อมูลส่วนบุคคล
- เราอาจแบ่งปันกับผู้ให้บริการที่เชื่อถือได้
- เราอาจเปิดเผยตามกฎหมาย

## 4. การเก็บรักษาข้อมูล
- เราเก็บข้อมูลตราบเท่าที่จำเป็น
- คุณสามารถขอลบข้อมูลได้

## 5. สิทธิ์ของคุณ (PDPA)
- สิทธิ์เข้าถึงข้อมูล
- สิทธิ์แก้ไขข้อมูล
- สิทธิ์ลบข้อมูล
- สิทธิ์คัดค้านการประมวลผล
- สิทธิ์ถอนความยินยอม

## 6. คุกกี้
ดูรายละเอียดใน [นโยบายคุกกี้](/cookies)

## 7. ความปลอดภัย
เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม

## 8. การติดต่อ
อีเมล: privacy@dealdoor.co
```

---

## 6. Data Subject Requests

### 6.1 Request Types

| Type | Description | Response Time |
|------|-------------|---------------|
| Access | Get copy of personal data | 30 days |
| Rectification | Correct inaccurate data | 30 days |
| Erasure | Delete personal data | 30 days |
| Restriction | Limit data processing | 30 days |
| Portability | Get data in machine format | 30 days |
| Objection | Object to data processing | 30 days |

### 6.2 Implementation

```typescript
// src/pages/api/privacy/request.ts

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  
  // Log the request
  await logPrivacyRequest({
    email: data.email,
    type: data.type, // access, rectification, erasure, etc.
    description: data.description,
    createdAt: new Date(),
  });
  
  // Send confirmation email
  await sendEmail({
    to: data.email,
    subject: 'DealDoor - รับคำขอเรียบร้อย',
    template: 'privacy-request-confirmation',
    data: { type: data.type },
  });
  
  return new Response(
    JSON.stringify({ success: true, message: 'รับคำขอแล้ว เราจะดำเนินการภายใน 30 วัน' }),
    { status: 200 }
  );
};
```

---

## 7. Data Retention Policy

| Data Type | Retention Period | After Expiration |
|-----------|------------------|------------------|
| Account data | Until deletion request | Anonymize |
| Shop data | Until deletion request | Anonymize |
| Deal data | 1 year after expiration | Archive |
| Analytics | 2 years | Anonymize |
| Logs | 90 days | Delete |
| Backups | 30 days | Delete |

---

## 8. Privacy Page Component

```astro
---
// src/pages/privacy/index.astro

import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="นโยบายความเป็นส่วนตัว">
  <article class="mx-auto max-w-3xl px-4 py-8 prose">
    <h1>นโยบายความเป็นส่วนตัว</h1>
    <p class="text-gray-500">วันที่มีผล: 1 กรกฎาคม 2568</p>
    
    <!-- Privacy policy content -->
    
    <h2>สิทธิ์ของคุณ</h2>
    <p>คุณสามารถใช้สิทธิ์ต่อไปนี้:</p>
    <ul>
      <li>ขอลบข้อมูล</li>
      <li>ขอแก้ไขข้อมูล</li>
      <li>ขอสำเนาข้อมูล</li>
    </ul>
    <a href="/privacy/request" class="rounded-lg bg-primary px-4 py-2 text-white">
      ยื่นคำขอ
    </a>
  </article>
</BaseLayout>
```

---

## 9. Merchant Agreement

```markdown
# ข้อตกลงสำหรับร้านค้า

## 1. การให้บริการ
DealDoor ให้บริการสร้างหน้าโปรโมชันสำหรับร้านค้า

## 2. ความรับผิดชอบของร้านค้า
- ให้ข้อมูลที่ถูกต้องและเป็นปัจจุบัน
- ไม่โพสต์เนื้อหาที่ผิดกฎหมายหรือหลอกลวง
- ปฏิบัติตามกฎหมายคุ้มครองผู้บริโภค

## 3. เนื้อหา
- ร้านค้าเป็นเจ้าของเนื้อหาที่โพสต์
- ร้านค้ายอมให้ DealDoor แสดงเนื้อหาบนแพลตฟอร์ม

## 4. การชำระเงิน (สำหรับแพลน Pro)
- ค่าบริการไม่สามารถคืนเงินได้
- การต่ออายุอัตโนมัติ

## 5. การระงับบัญชี
DealDoor สงวนสิทธิ์ในการระงับบัญชีที่ละเมิดข้อกำหนด
```

---

## 10. Legal Pages Routes

```
src/pages/
├── terms.astro           # Terms of Service
├── privacy/
│   ├── index.astro       # Privacy Policy
│   └── request.astro     # Data subject request form
├── cookies.astro         # Cookie Policy
├── acceptable-use.astro  # Acceptable Use Policy
└── merchant-terms.astro  # Merchant Agreement
```

---

## 11. Compliance Checklist

### PDPA
- [ ] Privacy Policy published
- [ ] Cookie consent mechanism
- [ ] Data subject request form
- [ ] Data retention policy defined
- [ ] Consent records maintained
- [ ] Data processing agreements with vendors

### General
- [ ] Terms of Service published
- [ ] Cookie Policy published
- [ ] Contact information provided
- [ ] Grievance mechanism available

---

## 12. File Structure

```
src/
├── lib/
│   └── consent.ts            # Consent management
├── components/
│   └── shared/
│       └── CookieBanner.tsx
└── pages/
    ├── terms.astro
    ├── privacy/
    │   ├── index.astro
    │   └── request.astro
    ├── cookies.astro
    ├── acceptable-use.astro
    └── merchant-terms.astro
```
