"use client";

import type { Product } from "@/lib/mock-data";
import type { NormalizedVariant } from "@/lib/oxid-variant-selection";
import { formatEur } from "@/lib/pricing";

type Props = {
  product: Product;
  hasVariants: boolean;
  isComplete: boolean;
  selectedVariant?: NormalizedVariant | null;
};

function formatConfiguration(
  hasVariants: boolean,
  isComplete: boolean,
  selectedVariant: NormalizedVariant | null | undefined,
  product: Product
): string {
  if (hasVariants) {
    if (!isComplete) return "— noch nicht vollständig —";
    if (selectedVariant?.oxvarselect) {
      return selectedVariant.oxvarselect
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean)
        .join(", ");
    }
    return "—";
  }

  return product.variant || product.unitName || "Standardausführung";
}

function formatArticleNumber(
  hasVariants: boolean,
  isComplete: boolean,
  sku: string
): string {
  if (hasVariants && !isComplete) return "wird ermittelt …";
  return sku;
}

export function ArticleConfigInfoCard({
  product,
  hasVariants,
  isComplete,
  selectedVariant,
}: Props) {
  const taxRateLabel = Math.round(product.taxRate * 100);
  const showPrice = (!hasVariants || isComplete) && product.unitPriceExclTax > 0;
  const pzn = product.mpzn?.trim();

  return (
    <div className="article-config-info-card" aria-live="polite">
      <div className="article-config-info-row">
        <span className="article-config-info-label">Konfiguration</span>
        <span className="article-config-info-value">
          {formatConfiguration(hasVariants, isComplete, selectedVariant, product)}
        </span>
      </div>

      <div className="article-config-info-row">
        <span className="article-config-info-label">Artikelnummer</span>
        <span className="article-config-info-value">
          {formatArticleNumber(hasVariants, isComplete, product.sku)}
        </span>
      </div>

      {pzn ? (
        <div className="article-config-info-row">
          <span className="article-config-info-label">PZN</span>
          <span className="article-config-info-value">{pzn}</span>
        </div>
      ) : null}

      <div className="article-config-info-row article-config-info-row-price">
        <span className="article-config-info-label">Stückpreis</span>
        <div className="article-config-info-value-stack">
          <span className="article-config-info-value">
            {showPrice ? formatEur(product.unitPriceExclTax) : "—"}
          </span>
          <span className="article-config-info-tax">
            zzgl. {taxRateLabel} % MwSt.
          </span>
        </div>
      </div>
    </div>
  );
}
