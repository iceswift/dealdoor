export const prerender = false;

import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';

const imageTypes: Record<string, string> = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif' };

export const GET: APIRoute = async ({ params }) => {
  const root = resolve(process.env.MEDIA_LOCAL_ROOT || 'public', 'uploads');
  const path = resolve(root, params.path || '');
  const relativePath = relative(root, path);
  const contentType = imageTypes[extname(path).toLowerCase()];
  if (!relativePath || relativePath.startsWith('..') || relativePath.includes(':') || !contentType) return new Response('Not found', { status: 404 });
  try {
    const body = await readFile(path);
    return new Response(body, { headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error: any) {
    if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return new Response('Not found', { status: 404 });
    throw error;
  }
};
