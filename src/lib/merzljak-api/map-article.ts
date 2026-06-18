import type { Product } from "@/lib/mock-data";
import { getMerzljakImageBaseUrl } from "./config";

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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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
      "oxtprice",
    ]) ?? 0;

  const vatPercent = pickNumber(record, ["oxvat", "OXVAT", "vat"]) ?? 19;
  const taxRate = vatPercent > 1 ? vatPercent / 100 : vatPercent;

  const imageUrls = getImageUrls(record);
  const shortDescription = pickString(record, [
    "oxshortdesc",
    "OXSHORTDESC",
    "shortDescription",
  ]);
  const details = pickString(record, ["nxsdetails", "mwvktext", "details"]);
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
  const description =
    htmlToText(pickString(record, ["oxlongdesc", "mwvfeature", "description"])) ??
    htmlToText(details);
  const categories = getCategoryNames(record);

  return {
    sku,
    ...(oxidId ? { oxidId } : {}),
    name,
    ...(shortDescription ? { shortDescription } : {}),
    ...(description ? { description } : {}),
    ...(details ? { details } : {}),
    ...(modelType ? { modelType } : {}),
    ...(deliveryScope ? { deliveryScope } : {}),
    ...(unitName ? { unitName } : {}),
    ...(variant ? { variant } : {}),
    ...(categories ? { categories } : {}),
    ...(imageUrls[0] ? { thumbnailUrl: imageUrls[0] } : {}),
    ...(imageUrls.length > 0 ? { imageUrls } : {}),
    unitPriceExclTax: Math.round(price * 100) / 100,
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
