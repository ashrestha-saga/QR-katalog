import type { Product } from "./mock-data";

export const WISHLIST_SESSION_KEY = "katalog_wishlist";

export const CART_UPDATED_EVENT = "katalog-cart-updated";

export type ArticleConfiguration = {
  sku: string;
  quantity: number;
  product?: Product;
  /** Phase 2+ (Händler step) */
  haendlerId?: string;
  region?: string;
  remember?: boolean;
};

export type ConfiguredCartLine = {
  sku: string;
  quantity: number;
  product?: Product;
  haendlerId: string;
  region: string;
  remember: boolean;
  configuredAt: number;
};

type WishlistData = {
  catalogSlug: string;
  lines: ConfiguredCartLine[];
};

function dispatchCartUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function readRaw(): WishlistData | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WISHLIST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WishlistData;
    if (!parsed.catalogSlug || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(data: WishlistData): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(WISHLIST_SESSION_KEY, JSON.stringify(data));
  dispatchCartUpdated();
}

export function getCartLines(catalogSlug: string): ConfiguredCartLine[] {
  const data = readRaw();
  if (!data || data.catalogSlug !== catalogSlug) return [];
  return [...data.lines].sort((a, b) => a.configuredAt - b.configuredAt);
}

export function getCartLine(
  catalogSlug: string,
  sku: string
): ConfiguredCartLine | undefined {
  return getCartLines(catalogSlug).find((l) => l.sku === sku);
}

/** Link target for editing a cart line (parent route + variant line key). */
export function buildCartLineEditHref(
  catalogSlug: string,
  line: ConfiguredCartLine
): string {
  const parentSku = line.product?.parentSku ?? line.sku;
  const params = new URLSearchParams();
  if (line.product?.parentSku && line.sku !== parentSku) {
    params.set("edit", line.sku);
  }
  const query = params.toString();
  return `/c/${catalogSlug}/article/${encodeURIComponent(parentSku)}${
    query ? `?${query}` : ""
  }`;
}

export function getCartArticleCount(catalogSlug: string): number {
  return getCartLines(catalogSlug).length;
}

export function getCartItemCount(catalogSlug: string): number {
  return getCartLines(catalogSlug).reduce((sum, l) => sum + l.quantity, 0);
}

export function upsertCartLine(
  catalogSlug: string,
  config: ArticleConfiguration
): ConfiguredCartLine[] {
  const qty = Math.max(1, Math.min(99, Math.floor(config.quantity)));

  const existing = readRaw();
  const lines =
    existing?.catalogSlug === catalogSlug ? [...existing.lines] : [];

  const index = lines.findIndex((l) => l.sku === config.sku);
  const configuredAt =
    index >= 0 ? lines[index].configuredAt : Date.now();

  const line: ConfiguredCartLine = {
    sku: config.sku,
    quantity: qty,
    ...(config.product ? { product: config.product } : {}),
    haendlerId: config.haendlerId ?? "",
    region: config.region ?? "",
    remember: config.remember ?? false,
    configuredAt,
  };

  if (index >= 0) {
    lines[index] = line;
  } else {
    lines.push(line);
  }

  write({ catalogSlug, lines });
  return lines;
}

export function removeCartLine(catalogSlug: string, sku: string): ConfiguredCartLine[] {
  const lines = getCartLines(catalogSlug).filter((l) => l.sku !== sku);
  write({ catalogSlug, lines });
  return lines;
}

export function clearCart(catalogSlug: string): void {
  const data = readRaw();
  if (!data || data.catalogSlug !== catalogSlug) return;
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(WISHLIST_SESSION_KEY);
  dispatchCartUpdated();
}

/** @deprecated use getCartLines */
export function getWishlistLines(catalogSlug: string) {
  return getCartLines(catalogSlug).map((l) => ({
    sku: l.sku,
    quantity: l.quantity,
  }));
}

/** @deprecated use getCartItemCount */
export function getWishlistCount(catalogSlug: string) {
  return getCartItemCount(catalogSlug);
}

/** @deprecated use clearCart */
export function clearWishlist(catalogSlug: string) {
  clearCart(catalogSlug);
}
