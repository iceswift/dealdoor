// src/lib/upload.ts

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

// ─── Upload Types ────────────────────────────────────────

export type UploadType = 'cover' | 'logo' | 'deal' | 'menu';

interface UploadConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSize: number; // bytes
}

const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  cover: { maxWidth: 1200, maxHeight: 400, quality: 80, maxSize: 2 * 1024 * 1024 },
  logo: { maxWidth: 200, maxHeight: 200, quality: 85, maxSize: 500 * 1024 },
  deal: { maxWidth: 800, maxHeight: 600, quality: 80, maxSize: 1 * 1024 * 1024 },
  menu: { maxWidth: 400, maxHeight: 400, quality: 80, maxSize: 500 * 1024 },
};

// ─── Allowed MIME Types ──────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ─── Validate File ───────────────────────────────────────

export function validateUpload(file: File, type: UploadType): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ JPG, PNG, WebP, GIF' };
  }

  // Check file size
  const config = UPLOAD_CONFIGS[type];
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024);
    return { valid: false, error: `ไฟล์ใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)` };
  }

  return { valid: true };
}

// ─── Process Image ───────────────────────────────────────

export async function processImage(
  buffer: Buffer,
  type: UploadType
): Promise<Buffer> {
  const config = UPLOAD_CONFIGS[type];

  return sharp(buffer)
    .resize(config.maxWidth, config.maxHeight, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: config.quality })
    .toBuffer();
}

// ─── Save Image ──────────────────────────────────────────

export async function saveImage(
  buffer: Buffer,
  type: UploadType,
  originalName: string
): Promise<string> {
  // Process image
  const processed = await processImage(buffer, type);

  // Generate unique filename
  const filename = `${randomUUID()}.webp`;

  // Determine upload directory
  const uploadDir = join(process.cwd(), 'public', 'uploads', type + 's');
  await mkdir(uploadDir, { recursive: true });

  // Save file
  const filepath = join(uploadDir, filename);
  await writeFile(filepath, processed);

  // Return public URL
  return `/uploads/${type}s/${filename}`;
}

// ─── Delete Image ────────────────────────────────────────

export async function deleteImage(url: string): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return;

  const { unlink } = await import('fs/promises');
  const filepath = join(process.cwd(), 'public', url);

  try {
    await unlink(filepath);
  } catch (error) {
    // File might not exist, ignore
  }
}

// ─── Generate Placeholder ────────────────────────────────

export function generatePlaceholder(text: string, size: number = 200): string {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#FFF0EB"/>
      <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.3}" 
            fill="#FF6B35" text-anchor="middle" dy=".35em">${text.charAt(0).toUpperCase()}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
