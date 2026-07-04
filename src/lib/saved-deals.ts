// src/lib/saved-deals.ts

// ─── Saved Deals (localStorage) ──────────────────────────

const SAVED_DEALS_KEY = 'dealdoor_saved_deals';
const FAVORITE_SHOPS_KEY = 'dealdoor_favorite_shops';

export function getSavedDeals(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(SAVED_DEALS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function saveDeal(dealId: string): void {
  const saved = getSavedDeals();
  if (!saved.includes(dealId)) {
    saved.push(dealId);
    localStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(saved));
  }
}

export function unsaveDeal(dealId: string): void {
  const saved = getSavedDeals().filter(id => id !== dealId);
  localStorage.setItem(SAVED_DEALS_KEY, JSON.stringify(saved));
}

export function isDealSaved(dealId: string): boolean {
  return getSavedDeals().includes(dealId);
}

// ─── Favorite Shops (localStorage) ───────────────────────

export function getFavoriteShops(): string[] {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(FAVORITE_SHOPS_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function addFavoriteShop(shopId: string): void {
  const favorites = getFavoriteShops();
  if (!favorites.includes(shopId)) {
    favorites.push(shopId);
    localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify(favorites));
  }
}

export function removeFavoriteShop(shopId: string): void {
  const favorites = getFavoriteShops().filter(id => id !== shopId);
  localStorage.setItem(FAVORITE_SHOPS_KEY, JSON.stringify(favorites));
}

export function isFavoriteShop(shopId: string): boolean {
  return getFavoriteShops().includes(shopId);
}

// ─── Clear All ───────────────────────────────────────────

export function clearSavedData(): void {
  localStorage.removeItem(SAVED_DEALS_KEY);
  localStorage.removeItem(FAVORITE_SHOPS_KEY);
}
