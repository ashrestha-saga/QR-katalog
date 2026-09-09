import type { Product } from "@/lib/mock-data";

/** Packaging unit hint, e.g. "VE: 100 Stück" — omit plain "Stück" without a quantity. */
export function formatVeLabel(unitName?: string): string | null {
  const unit = unitName?.trim();
  if (!unit) return null;
  if (!/\d/.test(unit)) return null;
  return /^ve\s*:/i.test(unit) ? unit : `VE: ${unit}`;
}

export function formatVariantWithUnit(
  product: Pick<Product, "variant" | "unitName">
): string | null {
  const variant = product.variant?.trim();
  const unit = product.unitName?.trim();
  const ve = formatVeLabel(unit);

  if (variant && ve) return `${variant} · ${ve}`;
  if (variant) return variant;
  return ve;
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
