import type { OxidVariantRecord, Product } from "@/lib/mock-data";
import { getMerzljakImageBaseUrl } from "./config";
import { sanitizeDescriptionHtml } from "./sanitize-rich-html";

type OxidArticleRecord = Record<string, unknown>;

function pickString(record: OxidArticleRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function pickNumber(record: OxidArticleRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

const FEATURE_HTML_TAGS = new Set([
  "ul",
  "ol",
  "li",
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "span",
  "div",
]);

function decodeHtmlEntities(value: string): string {
  let decoded = value;
  for (let i = 0; i < 2; i++) {
    decoded = decoded
      .replace(/&nbsp;/gi, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
  }
  return decoded;
}

function sanitizeFeatureHtml(value: string | null): string | undefined {
  if (!value) return undefined;

  const decoded = decodeHtmlEntities(value)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tag: string) => {
      const name = tag.toLowerCase();
      if (!FEATURE_HTML_TAGS.has(name)) return "";
      if (match.startsWith("</")) return `</${name}>`;
      if (name === "br") return "<br>";
      return `<${name}>`;
    })
    .trim();

  return decoded || undefined;
}

function mapDescriptionHtml(record: OxidArticleRecord): string | undefined {
  const mwvrtc = sanitizeDescriptionHtml(
    pickString(record, ["mwvrtc", "MWVRTC"])
  );
  if (mwvrtc) return mwvrtc;

  return sanitizeDescriptionHtml(
    pickString(record, ["oxlongdesc", "OXLONGDESC", "description"])
  );
}

function htmlToText(value: string | null): string | undefined {
  if (!value) return undefined;

  const text = decodeHtmlEntities(value)
    .replace(/<\/(p|li|h[1-6]|div|br)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || undefined;
}

function getImageUrls(record: OxidArticleRecord): string[] {
  const base = getMerzljakImageBaseUrl();
  if (!base) return [];
  const urls: string[] = [];

  for (let i = 1; i <= 12; i++) {
    const filename = pickString(record, [`oxpic${i}`, `OXPIC${i}`]);
    if (!filename) continue;

    urls.push(
      `${base}/out/pictures/master/product/${i}/${encodeURIComponent(filename)}`
    );
  }

  return urls;
}

function getCategoryNames(record: OxidArticleRecord): string[] | undefined {
  const categories = record.categories;
  if (!Array.isArray(categories)) return undefined;

  const names = new Set<string>();
  for (const category of categories) {
    if (!category || typeof category !== "object" || Array.isArray(category)) {
      continue;
    }

    const title = pickString(category as OxidArticleRecord, [
      "oxtitle",
      "OXTITLE",
      "title",
      "name",
    ]);
    if (title) names.add(title.trim());
  }

  return names.size > 0 ? [...names] : undefined;
}

function mapVariantRecord(record: OxidArticleRecord): OxidVariantRecord | null {
  const oxartnum = pickString(record, ["oxartnum", "OXARTNUM"]);
  const oxvarselect = pickString(record, ["oxvarselect", "OXVARSELECT"]);
  const oxid = pickString(record, ["oxid", "OXID"]);
  const oxtitle = pickString(record, ["oxtitle", "OXTITLE"]);
  const oxshortdesc = pickString(record, ["oxshortdesc", "OXSHORTDESC"]) ?? "";
  const oxprice = pickString(record, ["oxprice", "OXPRICE"]) ?? "0";
  const oxtprice = pickString(record, ["oxtprice", "OXTPRICE"]);
  const oxpic1 = pickString(record, ["oxpic1", "OXPIC1"]) ?? "";
  const oxstock = pickNumber(record, ["oxstock", "OXSTOCK"]) ?? -1;
  const mpzn = pickString(record, ["mpzn", "MPZN"]);
  const featureHtml = sanitizeFeatureHtml(
    pickString(record, ["mwvfeature", "MWVFEATURE"])
  );
  const descriptionHtml = mapDescriptionHtml(record);

  if (!oxartnum || !oxvarselect || !oxid || !oxtitle) return null;

  const imageUrls = getImageUrls(record);

  return {
    oxid,
    oxartnum,
    oxtitle,
    oxshortdesc,
    oxprice,
    ...(oxtprice ? { oxtprice } : {}),
    oxpic1,
    oxstock,
    oxvarselect,
    ...(mpzn ? { mpzn } : {}),
    ...(featureHtml ? { featureHtml } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(imageUrls[0] ? { thumbnailUrl: imageUrls[0] } : {}),
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
  };
}

function mapVariants(record: OxidArticleRecord): OxidVariantRecord[] | undefined {
  const raw = record.variants;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  const variants = raw
    .filter(
      (item): item is OxidArticleRecord =>
        item !== null && typeof item === "object" && !Array.isArray(item)
    )
    .map(mapVariantRecord)
    .filter((variant): variant is OxidVariantRecord => variant !== null);

  return variants.length > 0 ? variants : undefined;
}

/** Map OXID article API payload → catalog Product */
export function mapOxidArticleToProduct(
  record: OxidArticleRecord,
  fallbackSku?: string
): Product | null {
  const sku =
    pickString(record, ["oxartnum", "OXARTNUM", "artnum", "sku"]) ?? fallbackSku;
  const name = pickString(record, ["oxtitle", "OXTITLE", "title", "name"]);

  if (!sku || !name) return null;

  const oxidId = pickString(record, [
    "oxid",
    "OXID",
    "oxartid",
    "OXARTID",
    "articleid",
    "ARTICLEID",
  ]);

  const price =
    pickNumber(record, [
      "oxprice",
      "OXPRICE",
      "oxbprice",
      "price",
    ]) ?? 0;
  const listPrice = pickNumber(record, ["oxtprice", "OXTPRICE"]);
  const listPriceExclTax =
    listPrice !== undefined && listPrice !== null && listPrice > 0
      ? Math.round(listPrice * 100) / 100
      : undefined;

  const vatPercent = pickNumber(record, ["oxvat", "OXVAT", "vat"]) ?? 19;
  const taxRate = vatPercent > 1 ? vatPercent / 100 : vatPercent;
  const stock = pickNumber(record, ["oxstock", "OXSTOCK"]) ?? undefined;

  const imageUrls = getImageUrls(record);
  const shortDescription = pickString(record, [
    "oxshortdesc",
    "OXSHORTDESC",
    "shortDescription",
  ]);
  const details = pickString(record, ["nxsdetails", "mwvktext", "details"]);
  const featureHtml = sanitizeFeatureHtml(
    pickString(record, ["mwvfeature", "MWVFEATURE"])
  );
  const descriptionHtml = mapDescriptionHtml(record);
  const modelType = pickString(record, ["mwvpspez", "modelType", "type"]);
  const deliveryScope = pickString(record, [
    "mdeliveryscope",
    "deliveryScope",
  ]);
  const unitName = pickString(record, ["oxunitname", "OXUNITNAME", "unitName"]);
  const variant = pickString(record, [
    "oxvarselect",
    "OXVARSELECT",
    "variant",
  ]);
  const description = htmlToText(
    pickString(record, ["oxlongdesc", "description"])
  );
  const categories = getCategoryNames(record);
  const oxvarname = pickString(record, ["oxvarname", "OXVARNAME"]);
  const variants = mapVariants(record);
  const mpzn = pickString(record, ["mpzn", "MPZN"]);

  return {
    sku,
    ...(oxidId ? { oxidId } : {}),
    name,
    ...(shortDescription ? { shortDescription } : {}),
    ...(description ? { description } : {}),
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(details ? { details } : {}),
    ...(featureHtml ? { featureHtml } : {}),
    ...(modelType ? { modelType } : {}),
    ...(deliveryScope ? { deliveryScope } : {}),
    ...(unitName ? { unitName } : {}),
    ...(variant ? { variant } : {}),
    ...(oxvarname ? { oxvarname } : {}),
    ...(variants ? { variants } : {}),
    ...(categories ? { categories } : {}),
    ...(imageUrls[0] ? { thumbnailUrl: imageUrls[0] } : {}),
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
    ...(stock !== undefined ? { stock } : {}),
    ...(mpzn ? { mpzn } : {}),
    unitPriceExclTax: Math.round(price * 100) / 100,
    ...(listPriceExclTax !== undefined ? { listPriceExclTax } : {}),
    taxRate: Math.round(taxRate * 10000) / 10000,
    currency: "EUR",
  };
}

export function extractArticlesFromResponse(
  body: unknown
): OxidArticleRecord[] {
  if (!body || typeof body !== "object") return [];

  const root = body as Record<string, unknown>;

  if (Array.isArray(root.articles)) {
    return root.articles.filter(
      (item): item is OxidArticleRecord =>
        item !== null && typeof item === "object" && !Array.isArray(item)
    );
  }

  if (Array.isArray(root.data)) {
    return root.data.filter(
      (item): item is OxidArticleRecord =>
        item !== null && typeof item === "object" && !Array.isArray(item)
    );
  }

  if (root.article && typeof root.article === "object" && !Array.isArray(root.article)) {
    return [root.article as OxidArticleRecord];
  }

  return [];
}
