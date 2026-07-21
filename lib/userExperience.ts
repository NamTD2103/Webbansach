import type { Product } from '@/lib/api';

export interface CartStorageItem {
  MASP: string;
  TENSP: string;
  GIABAN: number;
  IMAGE_URL?: string;
  DESCRIPTION?: string;
  SOLUONGTON?: number;
  SOLUONG: number;
  TOTAL_PRICE: number;
}

export interface WishlistItem {
  MASP: string;
  TENSP: string;
  GIABAN: number;
  IMAGE_URL?: string;
  DESCRIPTION?: string;
}

const GUEST_CART_KEY = 'guest_cart_v1';
const WISHLIST_KEY = 'guest_wishlist_v1';
const SEARCH_HISTORY_KEY = 'book_search_history_v1';

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getGuestCart(): CartStorageItem[] {
  return readStorage<CartStorageItem[]>(GUEST_CART_KEY, []);
}

export function saveGuestCart(cart: CartStorageItem[]) {
  writeStorage(GUEST_CART_KEY, cart);
}

export function addGuestCartItem(product: Product, quantity = 1): CartStorageItem[] {
  const cart = getGuestCart();
  const existing = cart.find((item) => item.MASP === product.MASP);

  if (existing) {
    existing.SOLUONG += quantity;
    existing.TOTAL_PRICE = existing.SOLUONG * existing.GIABAN;
  } else {
    cart.push({
      MASP: product.MASP,
      TENSP: product.TENSP,
      GIABAN: product.GIABAN,
      IMAGE_URL: product.IMAGE_URL,
      DESCRIPTION: product.DESCRIPTION,
      SOLUONGTON: product.SOLUONGTON,
      SOLUONG: quantity,
      TOTAL_PRICE: product.GIABAN * quantity,
    });
  }

  saveGuestCart(cart);
  return cart;
}

export function updateGuestCartItem(masp: string, quantity: number) {
  const cart = getGuestCart().map((item) => {
    if (item.MASP !== masp) return item;
    const safeQuantity = Math.max(0, quantity);
    return {
      ...item,
      SOLUONG: safeQuantity,
      TOTAL_PRICE: item.GIABAN * safeQuantity,
    };
  }).filter((item) => item.SOLUONG > 0);

  saveGuestCart(cart);
  return cart;
}

export function removeGuestCartItem(masp: string) {
  const cart = getGuestCart().filter((item) => item.MASP !== masp);
  saveGuestCart(cart);
  return cart;
}

export function clearGuestCart() {
  saveGuestCart([]);
}

export function getWishlistItems(): WishlistItem[] {
  return readStorage<WishlistItem[]>(WISHLIST_KEY, []);
}

export function toggleWishlistItem(product: Product): { items: WishlistItem[]; isFavorite: boolean } {
  const items = getWishlistItems();
  const existingIndex = items.findIndex((item) => item.MASP === product.MASP);

  if (existingIndex >= 0) {
    items.splice(existingIndex, 1);
    writeStorage(WISHLIST_KEY, items);
    return { items, isFavorite: false };
  }

  items.push({
    MASP: product.MASP,
    TENSP: product.TENSP,
    GIABAN: product.GIABAN,
    IMAGE_URL: product.IMAGE_URL,
    DESCRIPTION: product.DESCRIPTION,
  });

  writeStorage(WISHLIST_KEY, items);
  return { items, isFavorite: true };
}

export function isWishlisted(masp: string) {
  return getWishlistItems().some((item) => item.MASP === masp);
}

export function getSearchHistory(): string[] {
  return readStorage<string[]>(SEARCH_HISTORY_KEY, []);
}

export function saveSearchHistory(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return getSearchHistory();

  const history = getSearchHistory().filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  history.unshift(trimmed);
  const next = history.slice(0, 8);
  writeStorage(SEARCH_HISTORY_KEY, next);
  return next;
}
