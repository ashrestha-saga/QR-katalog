export type Haendler = {
  id: string;
  name: string;
  regionShort: string;
  shopExample: string;
};

/** Slim OXID child article used for variant selection */
export type OxidVariantRecord = {
  oxid: string;
  oxartnum: string;
  oxtitle: string;
  oxshortdesc: string;
  oxprice: string;
  oxpic1: string;
  oxstock: number;
  oxvarselect: string;
  /** Resolved server-side — image host env is not available in the browser */
  thumbnailUrl?: string;
  imageUrls?: string[];
};

export type Product = {
  sku: string;
  /** OXID internal article ID (32-char) for basket addtoCart URLs */
  oxidId?: string;
  /** Parent/master SKU when this line represents a selected variant */
  parentSku?: string;
  name: string;
  catalogEdition?: string;
  shortDescription?: string;
  description?: string;
  details?: string;
  modelType?: string;
  deliveryScope?: string;
  /** Packaging unit (VE), e.g. "240 Stück" — from OXID oxunitname */
  unitName?: string;
  /** Selected variant, e.g. "55 cm, 50 m Rolle" — from OXID oxvarselect */
  variant?: string;
  /** OXID variant dimension labels, e.g. "Gestellfarbe | Polsterausführung" */
  oxvarname?: string;
  /** Child variant articles from the OXID API (parent product only) */
  variants?: OxidVariantRecord[];
  categories?: string[];
  thumbnailUrl?: string;
  imageUrls?: string[];
  /** Unit price excluding tax (EUR) */
  unitPriceExclTax: number;
  /** e.g. 0.19 for 19% VAT */
  taxRate: number;
  currency: "EUR";
};

export const MOCK_HAENDLER: Haendler[] = [
  {
    id: "varitec",
    name: "Varitec AG",
    regionShort: "Saarland, Rhineland-Palatinate",
    shopExample: "https://www.shop-arzt.de/produkt/",
  },
  {
    id: "promedia",
    name: "Promedia GmbH",
    regionShort: "Baden-Württemberg, Bavaria",
    shopExample: "https://www.promedia.de/p/",
  },
  {
    id: "medtec-nord",
    name: "MedTec Nord",
    regionShort: "Hamburg, Lower Saxony, Schleswig-Holstein",
    shopExample: "https://shop.medtec-nord.de/item/",
  },
];

export const COOKIE_NAME = "mz_haendler";
export const COOKIE_MAX_AGE_DAYS = 90;

export function getHaendler(id: string): Haendler | undefined {
  return MOCK_HAENDLER.find((h) => h.id === id);
}

export function buildTargetUrl(
  haendlerId: string,
  sku: string,
  quantity = 1
): string {
  const h = getHaendler(haendlerId);
  if (!h) return "#";
  const base = `${h.shopExample}${sku}`;
  const params = new URLSearchParams({
    utm_source: "katalog_qr",
    utm_medium: "qr",
    qty: String(Math.max(1, quantity)),
  });
  return `${base}?${params.toString()}`;
}

export type BasketLineInput = {
  sku: string;
  quantity: number;
};

/**
 * Order forwarding endpoint. Required in production via
 * NEXT_PUBLIC_CATALOG_FORWARD_URL (falls back to the shop base URL).
 */
function getCatalogForwardUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_CATALOG_FORWARD_URL?.trim() ||
    process.env.NEXT_PUBLIC_SHOP_BASE_URL?.trim();
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_CATALOG_FORWARD_URL (or NEXT_PUBLIC_SHOP_BASE_URL) must be set"
    );
  }
  return base.replace(/\/$/, "");
}

/**
 * Phase 1 — forward article(s) to catalog order endpoint (no Händler in URL).
 */
export function buildProductForwardUrl(
  sku: string,
  quantity = 1,
  catalogSlug?: string
): string {
  const base = getCatalogForwardUrl();
  const params = new URLSearchParams({
    utm_source: "katalog_qr",
    utm_medium: "qr",
    sku,
    qty: String(Math.max(1, quantity)),
  });
  if (catalogSlug) params.set("catalog", catalogSlug);
  return `${base}?${params.toString()}`;
}

/** Phase 1 — multi-line cart handoff without per-Händler URLs */
export function buildCartForwardUrl(
  lines: BasketLineInput[],
  catalogSlug?: string
): string {
  const base = getCatalogForwardUrl();
  const params = new URLSearchParams({
    utm_source: "katalog_qr",
    utm_medium: "qr",
  });
  if (catalogSlug) params.set("catalog", catalogSlug);
  for (const line of lines) {
    params.append("sku", line.sku);
    params.append("qty", String(Math.max(1, line.quantity)));
  }
  return `${base}?${params.toString()}`;
}

export function buildBasketUrl(
  haendlerId: string,
  lines: BasketLineInput[]
): string {
  const h = getHaendler(haendlerId);
  if (!h || lines.length === 0) return "#";

  const first = lines[0];
  const base = `${h.shopExample}${first.sku}`;
  const params = new URLSearchParams({
    utm_source: "katalog_qr",
    utm_medium: "qr",
    qty: String(Math.max(1, first.quantity)),
  });

  for (let i = 1; i < lines.length; i++) {
    params.append("sku", lines[i].sku);
    params.append("qty", String(Math.max(1, lines[i].quantity)));
  }

  return `${base}?${params.toString()}`;
}
