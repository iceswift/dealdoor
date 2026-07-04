# DealDoor — Image Handling Design

---

## 1. Overview

Images are critical for shop pages and deals. This document covers storage, optimization, and delivery.

---

## 2. Image Types

| Type | Dimensions | Max Size | Format |
|------|------------|----------|--------|
| Shop cover | 1200×400px | 2MB | WebP, JPG |
| Shop logo | 200×200px | 500KB | WebP, PNG |
| Deal image | 800×600px | 1MB | WebP, JPG |
| Menu item | 400×400px | 500KB | WebP, JPG |

---

## 3. Storage Strategy

### Phase 1: MVP (Local Filesystem)

```
public/
└── uploads/
    ├── shops/
    │   ├── covers/
    │   │   └── {shopId}-{hash}.webp
    │   └── logos/
    │       └── {shopId}-{hash}.webp
    ├── deals/
    │   └── {dealId}-{hash}.webp
    └── menu/
        └── {itemId}-{hash}.webp
```

**Pros:** Simple, no external dependencies
**Cons:** Not scalable, lost on redeploy

### Phase 2: Production (Cloudflare R2)

```
R2 Bucket: dealdoor-assets
├── shops/
│   ├── covers/
│   └── logos/
├── deals/
└── menu/
```

**Pros:** S3-compatible, cheap, global CDN
**Cons:** Requires setup

### Phase 3: Advanced (Cloudinary / Uploadthing)

Managed image service with built-in transformations.

---

## 4. Image Upload Flow

### 4.1 Client-Side

```typescript
// src/components/dashboard/ImageUpload.tsx

import { useState, useRef } from 'react';

interface ImageUploadProps {
  type: 'cover' | 'logo' | 'deal' | 'menu';
  currentUrl?: string;
  onUpload: (url: string) => void;
}

const MAX_SIZES = {
  cover: 2 * 1024 * 1024,
  logo: 500 * 1024,
  deal: 1 * 1024 * 1024,
  menu: 500 * 1024,
};

export default function ImageUpload({ type, currentUrl, onUpload }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_SIZES[type]) {
      setError(`ไฟล์ใหญ่เกินไป (สูงสุด ${MAX_SIZES[type] / 1024 / 1024}MB)`);
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const { url } = await response.json();
      onUpload(url);
    } catch (err) {
      setError('อัปโหลดไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          error ? 'border-red-300' : 'border-gray-300 hover:border-primary'
        } ${type === 'cover' ? 'h-48' : type === 'logo' ? 'h-32 w-32' : 'h-40'}`}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <div className="text-center">
              <span className="text-3xl">📷</span>
              <p className="mt-1 text-sm">คลิกเพื่อเลือกรูป</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

### 4.2 Server-Side Upload Handler

```typescript
// src/pages/api/upload.ts

import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
      });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;

    // Determine upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', type + 's');
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return URL
    const url = `/uploads/${type}s/${filename}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
    });
  }
};
```

---

## 5. Image Optimization

### 5.1 Sharp Integration

```typescript
// src/lib/image.ts

import sharp from 'sharp';
import { join } from 'path';

interface OptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}

export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
  } = options;

  let pipeline = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'center',
    });
  }

  // Convert format and optimize
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'jpg':
      pipeline = pipeline.jpeg({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality });
      break;
  }

  return pipeline.toBuffer();
}

// Preset optimizations
export const IMAGE_PRESETS = {
  shopCover: { width: 1200, height: 400, quality: 80, format: 'webp' as const },
  shopLogo: { width: 200, height: 200, quality: 85, format: 'webp' as const },
  dealImage: { width: 800, height: 600, quality: 80, format: 'webp' as const },
  menuItem: { width: 400, height: 400, quality: 80, format: 'webp' as const },
};
```

### 5.2 Upload with Optimization

```typescript
// Updated upload handler

import { optimizeImage, IMAGE_PRESETS } from '../lib/image';

// In POST handler, after getting buffer:
const preset = IMAGE_PRESETS[type as keyof typeof IMAGE_PRESETS];
const optimizedBuffer = await optimizeImage(buffer, preset);

// Save optimized version
await writeFile(filepath, optimizedBuffer);
```

---

## 6. Placeholder Images

### 6.1 SVG Placeholders

```typescript
// src/lib/placeholders.ts

export function generatePlaceholder(text: string, size: number = 200): string {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFF0EB"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.3}" 
            fill="#FF6B35" text-anchor="middle" dy=".35em">${text.charAt(0)}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function generateShopPlaceholder(name: string): string {
  return generatePlaceholder(name);
}

export function generateDealPlaceholder(): string {
  return `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#F7F7F8"/>
      <text x="50%" y="50%" font-family="Arial" font-size="48" 
            fill="#9B9B9B" text-anchor="middle" dy=".35em">🏷️</text>
    </svg>
  `;
}
```

### 6.2 Usage in Components

```astro
---
import { generateShopPlaceholder } from '../lib/placeholders';

const placeholder = generateShopPlaceholder(shop.name);
---

<div class="h-48 overflow-hidden bg-gray-100">
  <img
    src={shop.coverImage || placeholder}
    alt={shop.name}
    class="h-full w-full object-cover"
    loading="lazy"
  />
</div>
```

---

## 7. Image Component

```astro
---
// src/components/shared/Image.astro

interface Props {
  src?: string | null;
  alt: string;
  fallback?: string;
  class?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

const {
  src,
  alt,
  fallback = '📷',
  class: className = '',
  loading = 'lazy',
  width,
  height,
} = Astro.props;

const hasImage = src && src.length > 0;
---

{hasImage ? (
  <img
    src={src}
    alt={alt}
    class={className}
    loading={loading}
    width={width}
    height={height}
    onerror={`this.style.display='none'; this.nextElementSibling.style.display='flex'`}
  />
  <div class={`hidden items-center justify-center bg-gray-100 ${className}`}>
    <span class="text-3xl">{fallback}</span>
  </div>
) : (
  <div class={`flex items-center justify-center bg-gray-100 ${className}`}>
    <span class="text-3xl">{fallback}</span>
  </div>
)}
```

---

## 8. Lazy Loading

```astro
<!-- Native lazy loading -->
<img src={imageUrl} loading="lazy" alt="..." />

<!-- Intersection Observer for custom loading -->
<script>
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        observer.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    observer.observe(img);
  });
</script>
```

---

## 9. CDN Configuration (Future)

### 9.1 Cloudflare R2 + CDN

```typescript
// src/lib/storage.ts

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await R2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `https://${process.env.CF_DOMAIN}/${key}`;
}
```

### 9.2 Image Transformations via URL

```
https://cdn.dealdoor.co/shops/covers/abc123.webp?width=600&quality=75
```

---

## 10. Image Cleanup

```typescript
// src/lib/cleanup.ts

import { unlink, readdir } from 'fs/promises';
import { join } from 'path';

export async function deleteImage(url: string): Promise<void> {
  if (url.startsWith('/uploads/')) {
    const filepath = join(process.cwd(), 'public', url);
    try {
      await unlink(filepath);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }
}

export async function cleanupOrphanedImages(validUrls: Set<string>): Promise<void> {
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  
  async function scanDir(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else {
        const url = fullPath.replace(join(process.cwd(), 'public'), '');
        if (!validUrls.has(url)) {
          await unlink(fullPath);
        }
      }
    }
  }
  
  await scanDir(uploadsDir);
}
```

---

## 11. File Structure

```
src/
├── lib/
│   ├── image.ts           # Image optimization utilities
│   ├── storage.ts         # R2/S3 upload (future)
│   ├── placeholders.ts    # SVG placeholder generation
│   └── cleanup.ts         # Orphaned image cleanup
├── components/
│   └── shared/
│       └── Image.astro    # Universal image component
└── pages/
    └── api/
        └── upload.ts      # Upload API endpoint
```
