import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, normalize, relative } from 'node:path';

export type MediaStorageDriver = 'local' | 'r2';

function storageDriver(): MediaStorageDriver {
  return process.env.STORAGE_DRIVER === 'r2' ? 'r2' : 'local';
}

function localRoot() {
  return process.env.MEDIA_LOCAL_ROOT || join(process.cwd(), 'public');
}

function publicBaseUrl() {
  return (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
}

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET_NAME || !publicBaseUrl()) {
    throw new Error('R2 storage is selected but required environment variables are missing.');
  }
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function assertSafeKey(key: string) {
  const normalized = normalize(key).replace(/\\/g, '/');
  if (!normalized.startsWith('uploads/') || normalized.includes('../')) throw new Error('Invalid media storage key.');
  return normalized;
}

export async function storeMediaObject(params: { key: string; body: Buffer; contentType: string }): Promise<string> {
  const key = assertSafeKey(params.key);
  if (storageDriver() === 'r2') {
    const client = getR2Client();
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return `${publicBaseUrl()}/${key}`;
  }

  const root = localRoot();
  const path = join(root, key);
  if (relative(root, path).startsWith('..')) throw new Error('Invalid local media path.');
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, params.body);
  return `/${key}`;
}

export async function deleteMediaObject(url: string): Promise<void> {
  if (!url) return;
  if (storageDriver() === 'r2' && url.startsWith(`${publicBaseUrl()}/`)) {
    const key = assertSafeKey(url.slice(publicBaseUrl().length + 1));
    await getR2Client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }));
    return;
  }
  if (!url.startsWith('/uploads/')) return;
  const root = localRoot();
  const path = join(root, assertSafeKey(url.slice(1)));
  try {
    await unlink(path);
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
