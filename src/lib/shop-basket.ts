import { getShopApiBaseUrl } from "@/lib/shop-api/config";

export type OxidBasketLine = {
  oxidId: string;
  quantity: number;
};

/** Clamp cart quantity to 1–99 */
export function clampBasketQuantity(value: number): number {
  return Math.max(1, Math.min(99, Math.floor(value)));
}

/** Shop root for OXID basket redirect (no trailing slash) */
export function getShopBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SHOP_BASE_URL?.trim() || getShopApiBaseUrl();
  if (!fromEnv) {
    throw new Error(
      "NEXT_PUBLIC_SHOP_BASE_URL (or SHOP_API_BASE_URL) must be set"
    );
  }
  return fromEnv.replace(/\/$/, "");
}

/**
 * OXID add-to-cart URL, e.g.
 * {base}/index.php?cl=basket&fnc=addToCart&aproducts[{oxid}][am]=3&aproducts[{oxid}][am]=2
 */
export function buildOxidAddToCartUrl(lines: OxidBasketLine[]): string {
  if (lines.length === 0) return "#";

  const base = getShopBaseUrl();
  const params = lines.map(
    (line) =>
      `aproducts[${line.oxidId}][am]=${clampBasketQuantity(line.quantity)}`
  );

  return `${base}/index.php?cl=basket&fnc=addToCart&${params.join("&")}`;
}

/** Dev fallback: MOCK_OXID_BY_SKU='{"12345":"05848170643ab0deb9914566391c0c63"}' */
export function getMockOxidBySku(sku: string): string | undefined {
  const raw = process.env.MOCK_OXID_BY_SKU?.trim();
  if (!raw) return undefined;

  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[sku]?.trim() || undefined;
  } catch {
    return undefined;
  }
}
