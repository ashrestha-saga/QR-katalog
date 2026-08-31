export type OrderMode = "shop" | "inquiry";

function hasShopCheckoutUrls(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CATALOG_FORWARD_URL?.trim() ||
      process.env.NEXT_PUBLIC_SHOP_BASE_URL?.trim()
  );
}

/** Shop redirect vs. inquiry form + SMTP email. */
export function getOrderMode(): OrderMode {
  const override = process.env.NEXT_PUBLIC_CATALOG_ORDER_MODE?.trim()?.toLowerCase();
  if (override === "inquiry") return "inquiry";
  if (override === "shop") return "shop";
  return hasShopCheckoutUrls() ? "shop" : "inquiry";
}

export function isShopCheckoutEnabled(): boolean {
  return getOrderMode() === "shop";
}

/** Catalog page mode: single-article scan flow ends with a full-page inquiry form instead of cart. */
export function isInquiryCatalogMode(): boolean {
  return getOrderMode() === "inquiry";
}
