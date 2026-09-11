import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { fetchArticleBySku, getProductSourceLabel } from "@/lib/product-source";
import { isMerzljakApiConfigured } from "@/lib/merzljak-api/config";
import {
  mergeScanGrant,
  readScanGrant,
  SCAN_GRANT_COOKIE,
  scanGrantCookieOptions,
  sealScanGrant,
} from "@/lib/scan-grant";

export const preferredRegion = "fra1";

type Body = {
  sku?: string;
  catalogSlug?: string;
};

/**
 * POST /api/scan/grant — verify article exists, then set/extend HttpOnly scan grant cookie.
 * Called after a catalog QR scan (or cart re-entry) before opening the article page.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const sku = body.sku?.trim() ?? "";
  const catalogSlug = body.catalogSlug?.trim() ?? "";

  if (!sku || !catalogSlug) {
    return NextResponse.json(
      { error: "sku_and_catalog_required" },
      { status: 400 }
    );
  }

  if (!getCatalog(catalogSlug)) {
    return NextResponse.json({ error: "unknown_catalog" }, { status: 404 });
  }

  const product = await fetchArticleBySku(sku);
  if (!product) {
    return NextResponse.json(
      {
        error: "article_not_found",
        sku,
        source: getProductSourceLabel(),
        api_configured: isMerzljakApiConfigured(),
      },
      { status: 404 }
    );
  }

  const existing = await readScanGrant();
  const grant = mergeScanGrant(existing, catalogSlug, product.sku);
  // Also allow parent route SKU when the scanned code resolves to a variant child
  // whose display sku matches product.sku; grant the requested sku too if different.
  const withRequested =
    sku !== product.sku ? mergeScanGrant(grant, catalogSlug, sku) : grant;

  const token = sealScanGrant(withRequested);
  const maxAge = Math.max(1, withRequested.exp - Math.floor(Date.now() / 1000));

  const res = NextResponse.json({
    product,
    source: getProductSourceLabel(),
    api_configured: isMerzljakApiConfigured(),
    grant: { catalog: withRequested.catalog, skus: withRequested.skus },
  });

  res.cookies.set(SCAN_GRANT_COOKIE, token, scanGrantCookieOptions(maxAge));
  return res;
}
