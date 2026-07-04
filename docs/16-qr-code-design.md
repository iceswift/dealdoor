# DealDoor — QR Code Design

---

## 1. Overview

QR codes enable offline-to-online bridging for physical shops.

---

## 2. QR Code Types

| Type | Content | Use Case |
|------|---------|----------|
| Shop QR | `https://dealdoor.co/{slug}` | Storefront, business cards |
| Deal QR | `https://dealdoor.co/{slug}?deal={id}` | Printed promotions |
| Menu QR | `https://dealdoor.co/{slug}#menu` | Table displays |
| Dashboard QR | Share link for merchants | Quick sharing |

---

## 3. Library

### Recommended: `qrcode`

```bash
pnpm add qrcode
pnpm add -D @types/qrcode
```

**Pros:**
- Pure JavaScript, no external dependencies
- SVG and Canvas output
- Lightweight (~30KB)

---

## 4. QR Code Generation

### 4.1 Server-Side (SVG)

```typescript
// src/lib/qrcode.ts

import QRCode from 'qrcode';

interface QRCodeOptions {
  size?: number;
  color?: string;
  bgColor?: string;
  margin?: number;
  logo?: string;
}

export async function generateQRSvg(
  url: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = 300,
    color = '#1A1A2E',
    bgColor = '#FFFFFF',
    margin = 2,
  } = options;

  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    color: {
      dark: color,
      light: bgColor,
    },
    margin,
    errorCorrectionLevel: 'H', // High error correction for logo overlay
  });

  return svg;
}

export async function generateQRDataUrl(
  url: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const {
    size = 300,
    color = '#1A1A2E',
    bgColor = '#FFFFFF',
  } = options;

  return QRCode.toDataURL(url, {
    width: size,
    color: {
      dark: color,
      light: bgColor,
    },
    errorCorrectionLevel: 'H',
  });
}
```

### 4.2 Client-Side (Canvas)

```typescript
// src/components/shared/QRCode.tsx

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
  color?: string;
  bgColor?: string;
  className?: string;
}

export default function QRCodeComponent({
  url,
  size = 200,
  color = '#1A1A2E',
  bgColor = '#FFFFFF',
  className = '',
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        color: {
          dark: color,
          light: bgColor,
        },
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    }
  }, [url, size, color, bgColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`rounded-lg ${className}`}
    />
  );
}
```

---

## 5. QR Code Component with Branding

```tsx
// src/components/shared/BrandedQRCode.tsx

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface BrandedQRCodeProps {
  url: string;
  shopName: string;
  logoUrl?: string;
  size?: number;
  showDownload?: boolean;
}

export default function BrandedQRCode({
  url,
  shopName,
  logoUrl,
  size = 300,
  showDownload = true,
}: BrandedQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    generateQR();
  }, [url]);

  const generateQR = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate QR code
    await QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 0,
      color: {
        dark: '#1A1A2E',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High for logo overlay
    });

    // Add logo if provided
    if (logoUrl) {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoSize = size * 0.2;
        const logoX = (size - logoSize) / 2;
        const logoY = (size - logoSize) / 2;

        // White background for logo
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8, 8);
        ctx.fill();

        // Draw logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
        setGenerated(true);
      };
      logo.src = logoUrl;
    } else {
      setGenerated(true);
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    if (!canvasRef.current) return;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `${shopName.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>
      
      <p className="text-center text-sm text-gray-500">
        สแกนเพื่อดูโปรโมชันจาก {shopName}
      </p>

      {showDownload && (
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload('png')}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            📥 ดาวน์โหลด PNG
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 6. QR Code API Endpoint

```typescript
// src/pages/api/qr/[slug].ts

import type { APIRoute } from 'astro';
import { generateQRSvg } from '../../../lib/qrcode';
import { getShopBySlug } from '../../../lib/queries';

export const GET: APIRoute = async ({ params, request }) => {
  const shop = await getShopBySlug(params.slug!);
  
  if (!shop) {
    return new Response('Shop not found', { status: 404 });
  }

  const url = new URL(request.url);
  const dealId = url.searchParams.get('deal');
  const targetUrl = dealId
    ? `https://dealdoor.co/${shop.slug}?deal=${dealId}`
    : `https://dealdoor.co/${shop.slug}`;

  const size = parseInt(url.searchParams.get('size') || '300');
  const svg = await generateQRSvg(targetUrl, { size });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
```

**Usage:**
```
https://dealdoor.co/api/qr/moon-bowl-cafe
https://dealdoor.co/api/qr/moon-bowl-cafe?deal=deal_001&size=500
```

---

## 7. QR Code Dashboard Feature

```astro
---
// src/components/dashboard/QRCodeSection.tsx

import BrandedQRCode from '../shared/BrandedQRCode';

interface QRCodeSectionProps {
  slug: string;
  shopName: string;
  logoUrl?: string;
}

export default function QRCodeSection({ slug, shopName, logoUrl }: QRCodeSectionProps) {
  const shopUrl = `https://dealdoor.co/${slug}`;

  return (
    <div className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">📱 QR Code</h2>
      <p className="mt-1 text-sm text-gray-500">
        พิมพ์ QR Code นี้วางที่ร้าน หรือแนบไปกับโปรโมชัน
      </p>

      <div className="mt-4">
        <BrandedQRCode
          url={shopUrl}
          shopName={shopName}
          logoUrl={logoUrl}
          size={250}
        />
      </div>

      <div className="mt-4 rounded-lg bg-gray-50 p-3">
        <p className="text-xs text-gray-500">
          💡 เคล็ดลับ: วาง QR Code ที่เคาน์เตอร์ โต๊ะ หรือป้ายหน้าร้าน
        </p>
      </div>
    </div>
  );
}
```

---

## 8. Print-Ready QR Codes

### 8.1 High Resolution Output

```typescript
export async function generatePrintReadyQR(
  url: string,
  options: {
    size?: number;      // pixels
    dpi?: number;       // dots per inch
    format?: 'png' | 'svg';
  } = {}
): Promise<string> {
  const { size = 1000, format = 'png' } = options;

  if (format === 'svg') {
    return generateQRSvg(url, { size });
  }

  return generateQRDataUrl(url, { size });
}
```

### 8.2 Print Layout

```typescript
// src/lib/qr-print.ts

export function generatePrintHTML(
  qrDataUrl: string,
  shopName: string,
  url: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: white;
        }
        .qr-card {
          text-align: center;
          padding: 40px;
          border: 2px solid #E5E7EB;
          border-radius: 16px;
          max-width: 400px;
        }
        .qr-card img {
          width: 250px;
          height: 250px;
        }
        .shop-name {
          font-size: 24px;
          font-weight: bold;
          margin-top: 16px;
        }
        .url {
          font-size: 14px;
          color: #6B7280;
          margin-top: 8px;
        }
        .instruction {
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="qr-card">
        <img src="${qrDataUrl}" alt="QR Code" />
        <div class="shop-name">${shopName}</div>
        <div class="url">${url}</div>
        <div class="instruction">สแกนเพื่อดูโปรโมชันล่าสุด</div>
      </div>
    </body>
    </html>
  `;
}
```

---

## 9. QR Code Analytics (Future)

Track QR code scans by adding a tracking parameter:

```
https://dealdoor.co/moon-bowl-cafe?ref=qr
https://dealdoor.co/moon-bowl-cafe?ref=qr-storefront
https://dealdoor.co/moon-bowl-cafe?ref=qr-flyer
```

### Tracking Implementation

```typescript
// In shop page
const ref = Astro.url.searchParams.get('ref');

if (ref?.startsWith('qr')) {
  // Log QR scan event
  await logAnalyticsEvent({
    type: 'qr_scan',
    shopId: shop.id,
    ref,
    timestamp: new Date(),
  });
}
```

---

## 10. QR Code Design Variants

### 10.1 Standard

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │   QR Code     │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  Moon Bowl Cafe     │
│  สแกนเพื่อดูโปร     │
│                     │
└─────────────────────┘
```

### 10.2 With Logo

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │     ┌───┐     │  │
│  │     │LOG│     │  │
│  │     └───┘     │  │
│  └───────────────┘  │
│                     │
│  Moon Bowl Cafe     │
│                     │
└─────────────────────┘
```

### 10.3 Deal-Specific

```
┌─────────────────────┐
│  ┌───────────────┐  │
│  │               │  │
│  │   QR Code     │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  🎂 Birthday Deal   │
│  ฟรีบราวนี่!       │
│  หมดอายุ: 31 ก.ค.  │
│                     │
└─────────────────────┘
```

---

## 11. File Structure

```
src/
├── lib/
│   ├── qrcode.ts          # QR generation utilities
│   └── qr-print.ts        # Print-ready HTML generation
├── components/
│   └── shared/
│       ├── QRCode.tsx      # Basic QR component
│       └── BrandedQRCode.tsx # QR with logo
└── pages/
    └── api/
        └── qr/
            └── [slug].ts  # QR API endpoint
```
