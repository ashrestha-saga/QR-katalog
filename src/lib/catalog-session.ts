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

export type QrParseResult =
  | { kind: "sku"; sku: string }
  | { kind: "foreign_url" }
  | { kind: "wrong_catalog"; scannedSlug: string }
  | { kind: "invalid" };

const ARTICLE_PATH_RE = /^\/c\/([^/]+)\/article\/([^/]+)\/?$/;
const LEGACY_PRODUCT_PATH_RE = /^\/p\/([^/]+)\/?$/;

function appOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function looksLikeAbsoluteUrl(text: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(text);
}

/**
 * Parse scanned QR text: bare article number, or
 * `{NEXT_PUBLIC_APP_URL}/c/{catalogSlug}/article/{sku}` (origin + catalog must match).
 * Also accepts path-only `/c/{slug}/article/{sku}` and legacy `/p/{sku}` on our origin.
 */
export function parseScannedArticleQr(
  text: string,
  expectedCatalogSlug: string
): QrParseResult {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "invalid" };

  const expectedSlug = expectedCatalogSlug.trim();
  if (!expectedSlug) return { kind: "invalid" };

  // Bare article number (not a URL / article path)
  if (!looksLikeAbsoluteUrl(trimmed) && !trimmed.startsWith("/")) {
    return { kind: "sku", sku: trimmed };
  }

  let url: URL;
  try {
    url = looksLikeAbsoluteUrl(trimmed)
      ? new URL(trimmed)
      : new URL(trimmed, "https://placeholder.local");
  } catch {
    return { kind: "invalid" };
  }

  if (looksLikeAbsoluteUrl(trimmed)) {
    const allowed = appOrigin();
    if (!allowed || url.origin !== allowed) {
      return { kind: "foreign_url" };
    }
  }

  const articleMatch = url.pathname.match(ARTICLE_PATH_RE);
  if (articleMatch?.[1] && articleMatch[2]) {
    const scannedSlug = decodeURIComponent(articleMatch[1]);
    const sku = decodeURIComponent(articleMatch[2]).trim();
    if (!sku) return { kind: "invalid" };
    if (scannedSlug !== expectedSlug) {
      return { kind: "wrong_catalog", scannedSlug };
    }
    return { kind: "sku", sku };
  }

  // Legacy in-app product path (catalog comes from scan page)
  const legacyMatch = url.pathname.match(LEGACY_PRODUCT_PATH_RE);
  if (legacyMatch?.[1]) {
    const sku = decodeURIComponent(legacyMatch[1]).trim();
    return sku ? { kind: "sku", sku } : { kind: "invalid" };
  }

  return { kind: "invalid" };
}

/** @deprecated Prefer parseScannedArticleQr — kept for simple SKU extraction. */
export function parseArticleSkuFromQr(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (!looksLikeAbsoluteUrl(trimmed) && !trimmed.startsWith("/")) {
    return trimmed;
  }
  try {
    const url = looksLikeAbsoluteUrl(trimmed)
      ? new URL(trimmed)
      : new URL(trimmed, "https://placeholder.local");
    const articleMatch = url.pathname.match(ARTICLE_PATH_RE);
    if (articleMatch?.[2]) return decodeURIComponent(articleMatch[2]).trim() || null;
    const legacyMatch = url.pathname.match(LEGACY_PRODUCT_PATH_RE);
    if (legacyMatch?.[1]) return decodeURIComponent(legacyMatch[1]).trim() || null;
  } catch {
    /* fall through */
  }
  return null;
}
