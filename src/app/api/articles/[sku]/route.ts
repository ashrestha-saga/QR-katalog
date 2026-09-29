import { NextResponse } from "next/server";
import { fetchArticleBySku, getProductSourceLabel } from "@/lib/product-source";
import { isMerzljakApiConfigured } from "@/lib/merzljak-api/config";
import { isScanGrantRequired } from "@/lib/order-mode";
import { grantAllowsSku, readScanGrant } from "@/lib/scan-grant";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ sku: string }>;
};

/**
 * GET /api/articles/{sku}?catalog={slug}
 * Requires a valid scan-grant cookie in inquiry mode; open in shop mode.
 */
export async function GET(request: Request, { params }: Props) {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku).trim();

  if (!decoded) {
    return NextResponse.json({ error: "sku required" }, { status: 400 });
  }

  const catalogSlug =
    new URL(request.url).searchParams.get("catalog")?.trim() ?? "";
  if (!catalogSlug) {
    return NextResponse.json(
      { error: "catalog_required" },
      { status: 400 }
    );
  }

  if (isScanGrantRequired()) {
    const grant = await readScanGrant();
    if (!grantAllowsSku(grant, catalogSlug, decoded)) {
      return NextResponse.json(
        { error: "scan_required", sku: decoded },
        { status: 403 }
      );
    }
  }

  const product = await fetchArticleBySku(decoded);

  if (!product) {
    return NextResponse.json(
      {
        error: "article_not_found",
        sku: decoded,
        source: getProductSourceLabel(),
        api_configured: isMerzljakApiConfigured(),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    product,
    source: getProductSourceLabel(),
    api_configured: isMerzljakApiConfigured(),
  });
}
