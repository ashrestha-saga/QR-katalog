import { NextResponse } from "next/server";
import { fetchArticleBySku, getProductSourceLabel } from "@/lib/product-source";
import { isMerzljakApiConfigured } from "@/lib/merzljak-api/config";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ sku: string }>;
};

/** GET /api/articles/{sku} — article details from Merzljak shop API (or mock fallback) */
export async function GET(_request: Request, { params }: Props) {
  const { sku } = await params;
  const decoded = decodeURIComponent(sku).trim();

  if (!decoded) {
    return NextResponse.json({ error: "sku required" }, { status: 400 });
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
