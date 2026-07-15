import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { deleteMediaObject, storeMediaObject } from '../server/services/media-storage.service';

export type UploadType = 'cover' | 'logo' | 'deal' | 'menu';

type UploadConfig = { maxWidth: number; maxHeight: number; quality: number; maxSize: number };

const uploadConfigs: Record<UploadType, UploadConfig> = {
  cover: { maxWidth: 1280, maxHeight: 720, quality: 80, maxSize: 3 * 1024 * 1024 },
  logo: { maxWidth: 512, maxHeight: 512, quality: 82, maxSize: 1024 * 1024 },
  deal: { maxWidth: 1280, maxHeight: 720, quality: 80, maxSize: 3 * 1024 * 1024 },
  menu: { maxWidth: 512, maxHeight: 512, quality: 82, maxSize: 1024 * 1024 },
};

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateUpload(file: File, type: UploadType): { valid: boolean; error?: string } {
  if (!allowedTypes.has(file.type)) return { valid: false, error: 'รองรับเฉพาะ JPG, PNG, WebP และ GIF' };
  if (file.size > uploadConfigs[type].maxSize) return { valid: false, error: 'ไฟล์มีขนาดใหญ่เกินกำหนด' };
  return { valid: true };
}

export async function processImage(buffer: Buffer, type: UploadType) {
  const config = uploadConfigs[type];
  return sharp(buffer)
    .rotate()
    .resize(config.maxWidth, config.maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: config.quality, effort: 4 })
    .toBuffer();
}

export async function saveImage(buffer: Buffer, type: UploadType): Promise<string> {
  const body = await processImage(buffer, type);
  return storeMediaObject({ key: `uploads/${type}s/${randomUUID()}.webp`, body, contentType: 'image/webp' });
}

export async function deleteImage(url: string) {
  await deleteMediaObject(url);
}

export function generatePlaceholder(text: string, size = 200): string {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#FFF0EB"/><text x="50%" y="50%" font-family="Arial" font-size="${size * 0.3}" fill="#FF6B35" text-anchor="middle" dy=".35em">${text.charAt(0).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
