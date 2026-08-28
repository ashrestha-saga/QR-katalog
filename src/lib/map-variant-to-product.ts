import type { NormalizedVariant } from "@/lib/oxid-variant-selection";
import type { Product } from "@/lib/mock-data";

function parsePrice(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

/** Map a selected OXID variant onto a display Product (inherits parent metadata). */
export function mapVariantToDisplayProduct(
  parent: Product,
  variant: NormalizedVariant
): Product {
  const imageUrls = variant.imageUrls ?? [];
  const thumbnailUrl = variant.thumbnailUrl ?? imageUrls[0];

  return {
    ...parent,
    parentSku: parent.parentSku ?? parent.sku,
    sku: variant.oxartnum,
    oxidId: variant.oxid,
    name: variant.oxtitle,
    shortDescription: variant.oxshortdesc || parent.shortDescription,
    variant: variant.oxvarselect,
    unitPriceExclTax: parsePrice(variant.oxprice),
    stock: variant.oxstock,
    mpzn: variant.mpzn,
    thumbnailUrl: thumbnailUrl ?? parent.thumbnailUrl,
    imageUrls: imageUrls.length > 0 ? imageUrls : parent.imageUrls,
    featureHtml: variant.featureHtml ?? parent.featureHtml,
    descriptionHtml: variant.descriptionHtml ?? parent.descriptionHtml,
    oxvarname: undefined,
    variants: undefined,
  };
}
