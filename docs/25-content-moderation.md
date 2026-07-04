# DealDoor — Content Moderation Design

---

## 1. Overview

Content moderation ensures shops and deals are appropriate, trustworthy, and comply with platform policies.

---

## 2. Moderation Strategy

| Layer | Approach | When |
|-------|----------|------|
| Prevention | Guidelines, templates | Before submission |
| Automated | Content filtering | At submission |
| Community | User reports | After publication |
| Manual | Admin review | As needed |

---

## 3. Content Policies

### 3.1 Prohibited Content

| Category | Examples |
|----------|----------|
| Illegal | Counterfeit goods, prohibited substances |
| Deceptive | Fake deals, misleading discounts |
| Offensive | Hate speech, explicit content |
| Spam | Repetitive posting, irrelevant content |
| Scam | Phishing, fraudulent offers |
| Competitor | Direct competitor promotion |

### 3.2 Deal Content Rules

| Rule | Description |
|------|-------------|
| Accurate | Deal must match actual offer |
| Clear | Terms and conditions must be stated |
| Valid | Deal must not be expired |
| Unique | No duplicate deals |
| Reasonable | Discount must be realistic |

---

## 4. Automated Filtering

### 4.1 Content Filter

```typescript
// src/lib/content-filter.ts

const BLOCKED_WORDS = [
  // Add blocked words for Thai and English
  'spam', 'scam', 'fake', 'counterfeit',
  // Thai blocked words
  'spam', 'หลอกลวง', 'ของปลอม',
];

const SUSPICIOUS_PATTERNS = [
  /free\s*money/i,
  /click\s*here/i,
  /100%\s*guaranteed/i,
  /act\s*now/i,
];

export interface ContentCheckResult {
  approved: boolean;
  flags: string[];
  score: number; // 0-1, higher = more suspicious
}

export function checkContent(text: string): ContentCheckResult {
  const flags: string[] = [];
  let score = 0;

  // Check blocked words
  const lowerText = text.toLowerCase();
  for (const word of BLOCKED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      flags.push(`blocked_word:${word}`);
      score += 0.5;
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      flags.push(`suspicious_pattern:${pattern.source}`);
      score += 0.3;
    }
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    flags.push('excessive_caps');
    score += 0.2;
  }

  // Check for excessive special characters
  const specialRatio = (text.match(/[!@#$%^&*()]/g) || []).length / text.length;
  if (specialRatio > 0.3) {
    flags.push('excessive_special_chars');
    score += 0.2;
  }

  return {
    approved: score < 0.5,
    flags,
    score: Math.min(1, score),
  };
}

export function checkDealContent(deal: {
  title: string;
  description?: string;
  discountText: string;
}): ContentCheckResult {
  const results = [
    checkContent(deal.title),
    checkContent(deal.discountText),
    deal.description ? checkContent(deal.description) : { approved: true, flags: [], score: 0 },
  ];

  const allFlags = results.flatMap(r => r.flags);
  const maxScore = Math.max(...results.map(r => r.score));

  return {
    approved: maxScore < 0.5,
    flags: allFlags,
    score: maxScore,
  };
}
```

### 4.2 URL Validation

```typescript
export function validateUrls(urls: string[]): string[] {
  const suspicious: string[] = [];
  
  for (const url of urls) {
    try {
      const parsed = new URL(url);
      
      // Check for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl'];
      if (suspiciousDomains.includes(parsed.hostname)) {
        suspicious.push(url);
      }
      
      // Check for non-HTTPS
      if (parsed.protocol !== 'https:') {
        suspicious.push(url);
      }
    } catch {
      // Invalid URL
      suspicious.push(url);
    }
  }
  
  return suspicious;
}
```

---

## 5. Report System

### 5.1 Database Schema

```typescript
// db/schema.ts (additions)

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  reporterId: text('reporter_id'),              // null if anonymous
  targetType: text('target_type').notNull(),    // 'shop' | 'deal'
  targetId: text('target_id').notNull(),
  reason: text('reason').notNull(),             // spam, fake, offensive, etc.
  description: text('description'),
  status: text('status').default('pending'),    // pending, reviewed, resolved, dismissed
  reviewedBy: text('reviewed_by'),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  resolution: text('resolution'),               // removed, warning, no_action
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
```

### 5.2 Report Reasons

```typescript
export const REPORT_REASONS = {
  spam: { label: 'สแปม', description: 'เนื้อหาซ้ำ หรือไม่เกี่ยวข้อง' },
  fake: { label: 'ข้อมูลเท็จ', description: 'ดีลหรือข้อมูลร้านไม่จริง' },
  offensive: { label: 'เนื้อหาไม่เหมาะสม', description: 'คำหยาบ หรือเนื้อหาล่วงละเมิด' },
  scam: { label: 'หลอกลวง', description: 'ดูเหมือนการหลอกลวง' },
  expired: { label: 'หมดอายุ', description: 'ดีลหมดอายุแล้วแต่ยังแสดงอยู่' },
  incorrect: { description: 'ข้อมูลไม่ถูกต้อง', label: 'ข้อมูลผิด' },
  other: { label: 'อื่นๆ', description: 'เหตุผลอื่น' },
} as const;
```

### 5.3 Report API

```typescript
// src/pages/api/reports.ts

import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { reports } from '../../../db/schema';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  // Validate
  if (!data.targetType || !data.targetId || !data.reason) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  // Check for duplicate report
  const existing = await db.query.reports.findFirst({
    where: and(
      eq(reports.targetType, data.targetType),
      eq(reports.targetId, data.targetId),
      eq(reports.reason, data.reason),
      eq(reports.status, 'pending')
    ),
  });

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Report already submitted' }),
      { status: 409 }
    );
  }

  // Create report
  await db.insert(reports).values({
    targetType: data.targetType,
    targetId: data.targetId,
    reason: data.reason,
    description: data.description || null,
    createdAt: new Date(),
  });

  return new Response(
    JSON.stringify({ success: true, message: 'รายงานสำเร็จ' }),
    { status: 201 }
  );
};
```

---

## 6. Report Button Component

```tsx
// src/components/shared/ReportButton.tsx

import { useState } from 'react';
import { REPORT_REASONS } from '../../lib/constants';

interface ReportButtonProps {
  targetType: 'shop' | 'deal';
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;

    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType,
        targetId,
        reason,
        description,
      }),
    });

    setSubmitted(true);
    setTimeout(() => setIsOpen(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500"
      >
        รายงาน
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-4">
            {submitted ? (
              <div className="text-center">
                <span className="text-3xl">✅</span>
                <p className="mt-2">ขอบคุณสำหรับรายงาน</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold">รายงาน{targetType === 'shop' ? 'ร้านค้า' : 'ดีล'}</h3>
                
                <div className="mt-3 space-y-2">
                  {Object.entries(REPORT_REASONS).map(([key, { label }]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="reason"
                        value={key}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  className="mt-3 w-full rounded border p-2 text-sm"
                  rows={3}
                />

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded px-3 py-1 text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason}
                    className="rounded bg-red-500 px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    ส่งรายงาน
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

---

## 7. Admin Dashboard

### 7.1 Report Queue

```tsx
// src/components/admin/ReportQueue.tsx

export default function ReportQueue() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchReports(filter);
  }, [filter]);

  const fetchReports = async (status: string) => {
    const res = await fetch(`/api/admin/reports?status=${status}`);
    const data = await res.json();
    setReports(data);
  };

  const handleResolve = async (reportId: string, resolution: string) => {
    await fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', resolution }),
    });
    fetchReports(filter);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['pending', 'reviewed', 'resolved', 'dismissed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`rounded px-3 py-1 text-sm ${filter === status ? 'bg-primary text-white' : 'bg-gray-100'}`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((report: any) => (
          <div key={report.id} className="rounded border p-4">
            <div className="flex justify-between">
              <div>
                <span className="font-medium">{report.targetType}: {report.targetId}</span>
                <span className="ml-2 text-sm text-gray-500">{report.reason}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(report.createdAt).toLocaleDateString()}
              </span>
            </div>
            {report.description && (
              <p className="mt-2 text-sm text-gray-600">{report.description}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleResolve(report.id, 'removed')}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white"
              >
                ลบเนื้อหา
              </button>
              <button
                onClick={() => handleResolve(report.id, 'warning')}
                className="rounded bg-yellow-500 px-2 py-1 text-xs text-white"
              >
                ตักเตือน
              </button>
              <button
                onClick={() => handleResolve(report.id, 'no_action')}
                className="rounded bg-gray-500 px-2 py-1 text-xs text-white"
              >
                ไม่ดำเนินการ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Auto-Moderation Rules

```typescript
// src/lib/auto-moderation.ts

export async function autoModerateShop(shop: Shop): Promise<'approved' | 'review' | 'rejected'> {
  const checks = [
    checkContent(shop.name),
    checkContent(shop.description || ''),
  ];

  const maxScore = Math.max(...checks.map(c => c.score));

  if (maxScore >= 0.7) return 'rejected';
  if (maxScore >= 0.3) return 'review';
  return 'approved';
}

export async function autoModerateDeal(deal: Deal): Promise<'approved' | 'review' | 'rejected'> {
  const checks = [
    checkContent(deal.title),
    checkContent(deal.description || ''),
    checkContent(deal.discountText),
  ];

  const maxScore = Math.max(...checks.map(c => c.score));

  // Additional checks
  if (deal.endDate < new Date()) {
    return 'rejected'; // Expired deal
  }

  if (maxScore >= 0.7) return 'rejected';
  if (maxScore >= 0.3) return 'review';
  return 'approved';
}
```

---

## 9. Moderation Queue Status

| Status | Description | Action |
|--------|-------------|--------|
| `pending` | Awaiting review | Show in queue |
| `review` | Flagged for manual review | Show in priority queue |
| `approved` | Passed moderation | Show publicly |
| `rejected` | Failed moderation | Hide from public |
| `removed` | Removed by admin | Hide + notify merchant |

---

## 10. File Structure

```
src/
├── lib/
│   ├── content-filter.ts       # Content filtering
│   └── auto-moderation.ts      # Auto-moderation rules
├── components/
│   ├── shared/
│   │   └── ReportButton.tsx
│   └── admin/
│       └── ReportQueue.tsx
└── pages/
    └── api/
        ├── reports.ts
        └── admin/
            └── reports.ts
```
