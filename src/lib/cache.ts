// src/lib/cache.ts

// ─── Cache Headers ───────────────────────────────────────

export function getCacheHeaders(options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  isPublic?: boolean;
  noStore?: boolean;
}): Record<string, string> {
  const {
    maxAge = 0,
    sMaxAge = 0,
    staleWhileRevalidate = 0,
    isPublic = true,
    noStore = false,
  } = options;

  if (noStore) {
    return { 'Cache-Control': 'private, no-store, no-cache, must-revalidate' };
  }

  const directives: string[] = [];

  if (isPublic) {
    directives.push('public');
  } else {
    directives.push('private');
  }

  if (maxAge > 0) {
    directives.push(`max-age=${maxAge}`);
  }

  if (sMaxAge > 0) {
    directives.push(`s-maxage=${sMaxAge}`);
  }

  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  return { 'Cache-Control': directives.join(', ') };
}

// ─── Predefined Cache Strategies ─────────────────────────

// Static assets (JS, CSS, images with hash)
export function staticAssetCache(): Record<string, string> {
  return getCacheHeaders({
    maxAge: 31536000, // 1 year
    isPublic: true,
  });
}

// Shop page (short cache, stale-while-revalidate)
export function shopPageCache(): Record<string, string> {
  return getCacheHeaders({
    sMaxAge: 300, // 5 minutes
    staleWhileRevalidate: 600, // 10 minutes
    isPublic: true,
  });
}

// Explore page (very short cache)
export function explorePageCache(): Record<string, string> {
  return getCacheHeaders({
    sMaxAge: 60, // 1 minute
    staleWhileRevalidate: 120, // 2 minutes
    isPublic: true,
  });
}

// API with data (short cache)
export function apiCache(): Record<string, string> {
  return getCacheHeaders({
    sMaxAge: 60, // 1 minute
    staleWhileRevalidate: 120,
    isPublic: true,
  });
}

// Dashboard (no cache)
export function dashboardCache(): Record<string, string> {
  return getCacheHeaders({ noStore: true });
}

// ─── ETag Support ────────────────────────────────────────

export function generateETag(content: string): string {
  const hash = require('crypto').createHash('md5').update(content).digest('hex');
  return `"${hash.slice(0, 16)}"`;
}

export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}
