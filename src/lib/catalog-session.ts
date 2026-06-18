/** Session keys — cleared when browser tab closes */
export const CATALOG_SESSION_KEY = "katalog_catalog";
export const ARTICLE_SCAN_KEY = "katalog_article_scanned";

export function setCatalogSession(catalogSlug: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(CATALOG_SESSION_KEY, catalogSlug);
}

export function getCatalogSession(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(CATALOG_SESSION_KEY);
}

export function markArticleScanned(sku: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(ARTICLE_SCAN_KEY, sku);
}

export function getArticleScanned(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(ARTICLE_SCAN_KEY);
}

export function clearArticleScan(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(ARTICLE_SCAN_KEY);
}

export function canLoadArticle(
  sku: string,
  catalogSlug: string | null,
  fromScan: boolean
): boolean {
  if (fromScan) return true;
  const sessionCatalog = getCatalogSession();
  const scannedSku = getArticleScanned();
  const slug = catalogSlug ?? sessionCatalog;
  return Boolean(slug && sessionCatalog === slug && scannedSku === sku);
}

/** Parse article SKU from scanned QR text (URL or path) */
export function parseArticleSkuFromQr(text: string): string | null {
  const trimmed = text.trim();
  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://placeholder.local");
    const match = url.pathname.match(/\/p\/([^/]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  } catch {
    const pathMatch = trimmed.match(/\/p\/([^/?#]+)/);
    if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1]);
  }
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}
