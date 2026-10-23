export function getSiteOrigin(value = import.meta.env.PUBLIC_SITE_URL || 'https://dealdoor.co'): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('PUBLIC_SITE_URL must be an HTTP(S) origin without a path or credentials.');
  }
  return url.origin;
}
