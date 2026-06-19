import type { Product } from "@/lib/mock-data";

export function formatVariantWithUnit(
  product: Pick<Product, "variant" | "unitName">
): string | null {
  const variant = product.variant?.trim();
  const unit = product.unitName?.trim();

  if (variant && unit) return `${variant} · VE: ${unit}`;
  if (variant) return variant;
  if (unit) return `VE: ${unit}`;
  return null;
}

export function shouldShowShortDescription(
  product: Pick<Product, "shortDescription" | "variant">
): boolean {
  const short = product.shortDescription?.trim();
  if (!short) return false;
  const variant = product.variant?.trim();
  if (!variant) return true;
  return short.toLowerCase() !== variant.toLowerCase();
}
