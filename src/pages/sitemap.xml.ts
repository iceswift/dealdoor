// src/pages/sitemap.xml.ts

import type { APIRoute } from 'astro';
import { db } from '../lib/db';
import { shops } from '../lib/db-schema';

export const GET: APIRoute = async ({ site }) => {
  const allShops = await db.select().from(shops);
  
  const shopUrls = allShops.map(shop => `
    <url>
      <loc>${site}/${shop.slug}</loc>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${site}</loc>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${site}/explore</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      <url>
        <loc>${site}/explore/cafe</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
      <url>
        <loc>${site}/explore/restaurant</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
      <url>
        <loc>${site}/explore/beauty</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>
      ${shopUrls}
    </urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
