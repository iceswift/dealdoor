export const prerender = false;

import type { APIRoute } from 'astro';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db';
import { shops } from '../../../lib/db-schema';
import { firstRow } from '../../../lib/db-query';
import { getDealUrl, getShopUrl } from '../../../lib/deals/urls';

export const GET: APIRoute = async ({ params, request }) => {
  const shop = await firstRow(db.select().from(shops).where(eq(shops.slug, params.slug!)).limit(1));
  if (!shop) return new Response('Shop not found', { status: 404 });

  const url = new URL(request.url);
  const dealId = url.searchParams.get('deal');
  const targetUrl = new URL(
    dealId ? getDealUrl(shop, { id: dealId }) : getShopUrl(shop),
    url.origin,
  ).href;
  const requestedSize = Number.parseInt(url.searchParams.get('size') || '300', 10);
  const size = Number.isFinite(requestedSize) ? Math.min(Math.max(requestedSize, 160), 1200) : 300;

  try {
    const svg = await QRCode.toString(targetUrl, {
      type: 'svg',
      width: size,
      margin: 4,
      color: { dark: '#1A1A2E', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    });

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response('Failed to generate QR code', { status: 500 });
  }
};
