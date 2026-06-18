import { NextResponse } from "next/server";
import {
  buildBasketUrl,
  buildTargetUrl,
  getHaendler,
} from "@/lib/mock-data";
import { fetchArticleBySku } from "@/lib/product-source";
import {
  buildOxidAddToCartUrl,
  clampBasketQuantity,
  type OxidBasketLine,
} from "@/lib/shop-basket";
import { WIZARD_HAENDLER_STEP_ENABLED } from "@/lib/wizard-config";

export const preferredRegion = "fra1";

type BasketLineBody = {
  product_id?: string;
  quantity?: number;
  oxid_id?: string;
  haendler?: string;
};

type ResolvedOxidLine = {
  sku: string;
  quantity: number;
  oxidId: string;
};

async function resolveOxidBasketLines(
  rawLines: BasketLineBody[]
): Promise<{ lines: ResolvedOxidLine[] } | { error: string; status: number }> {
  const lines: ResolvedOxidLine[] = [];

  for (const row of rawLines) {
    const sku = row.product_id?.trim();
    const quantity = clampBasketQuantity(Number(row.quantity) || 1);
    const oxidFromClient = row.oxid_id?.trim();

    if (!sku) {
      return { error: "product_id required on each line", status: 400 };
    }

    let oxidId = oxidFromClient;
    if (!oxidId) {
      const product = await fetchArticleBySku(sku);
      if (!product) {
        return { error: `invalid product_id: ${sku}`, status: 400 };
      }
      oxidId = product.oxidId;
    }

    if (!oxidId) {
      return {
        error: `missing OXID article id for SKU ${sku} (Merzljak API or MOCK_OXID_BY_SKU)`,
        status: 400,
      };
    }

    lines.push({ sku, quantity, oxidId });
  }

  return { lines };
}

/** POST /api/basket — cart lines → OXID shop addtoCart redirect */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const remember = Boolean(body.remember);
  const rawLines = body.lines as BasketLineBody[] | undefined;
  const fallbackHaendler = body.haendler as string | undefined;

  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    return NextResponse.json({ error: "lines required" }, { status: 400 });
  }

  if (!WIZARD_HAENDLER_STEP_ENABLED) {
    const resolved = await resolveOxidBasketLines(rawLines);
    if ("error" in resolved) {
      return NextResponse.json(
        { error: resolved.error },
        { status: resolved.status }
      );
    }

    const oxidLines: OxidBasketLine[] = resolved.lines.map((line) => ({
      oxidId: line.oxidId,
      quantity: line.quantity,
    }));
    const redirect_url = buildOxidAddToCartUrl(oxidLines);

    return NextResponse.json({
      redirect_url,
      redirect_urls: [
        {
          label: "Warenkorb im Shop",
          url: redirect_url,
          line_count: oxidLines.length,
        },
      ],
      line_count: oxidLines.length,
    });
  }

  const parsed: Array<{
    sku: string;
    quantity: number;
    haendlerId: string;
  }> = [];

  for (const row of rawLines) {
    const productId = row.product_id?.trim();
    const haendler = row.haendler ?? fallbackHaendler;
    const quantity = clampBasketQuantity(Number(row.quantity) || 1);

    if (!haendler || !getHaendler(haendler)) {
      return NextResponse.json(
        { error: `invalid haendler for product ${productId}` },
        { status: 400 }
      );
    }
    if (!productId) {
      return NextResponse.json({ error: "product_id required" }, { status: 400 });
    }

    parsed.push({ sku: productId, quantity, haendlerId: haendler });
  }

  const byHaendler = new Map<
    string,
    Array<{ sku: string; quantity: number }>
  >();
  for (const line of parsed) {
    const group = byHaendler.get(line.haendlerId) ?? [];
    group.push({ sku: line.sku, quantity: line.quantity });
    byHaendler.set(line.haendlerId, group);
  }

  const redirect_urls = [...byHaendler.entries()].map(([haendlerId, group]) => {
    const h = getHaendler(haendlerId)!;
    const url =
      group.length === 1
        ? buildTargetUrl(haendlerId, group[0].sku, group[0].quantity)
        : buildBasketUrl(haendlerId, group);
    return {
      haendler: haendlerId,
      haendlerName: h.name,
      label: h.name,
      url,
      line_count: group.length,
    };
  });

  const response = NextResponse.json({
    redirect_urls,
    redirect_url: redirect_urls[0]?.url,
    line_count: parsed.length,
    _prototype: true,
  });

  if (remember && redirect_urls[0]) {
    const maxAge = 90 * 24 * 60 * 60;
    response.cookies.set("mz_haendler", redirect_urls[0].haendler, {
      maxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
