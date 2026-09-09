"use client";

import type { Product } from "@/lib/mock-data";
import type { NormalizedVariant } from "@/lib/oxid-variant-selection";
import { formatEur } from "@/lib/pricing";

type Props = {
  product: Product;
  hasVariants: boolean;
  isComplete: boolean;
  selectedVariant?: NormalizedVariant | null;
  /** Menge — Gesamtpreis updates with this (step 1) */
  quantity?: number;
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

  return product.shortDescription?.trim() || "—";
}

function formatArticleNumber(
  hasVariants: boolean,
  isComplete: boolean,
  sku: string
): string {
  if (hasVariants && !isComplete) return "wird ermittelt …";
  return sku;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function ArticleConfigInfoCard({
  product,
  hasVariants,
  isComplete,
  selectedVariant,
  quantity = 1,
}: Props) {
  const taxRateLabel = Math.round(product.taxRate * 100);
  const qty = Math.max(1, Math.floor(quantity));
  const showPrice = (!hasVariants || isComplete) && product.unitPriceExclTax > 0;
  const pzn = product.mpzn?.trim();
  const listPrice = product.listPriceExclTax;
  const showUvp =
    showPrice &&
    listPrice !== undefined &&
    listPrice > product.unitPriceExclTax;
  const totalPrice = roundMoney(product.unitPriceExclTax * qty);
  const listTotal =
    listPrice !== undefined ? roundMoney(listPrice * qty) : undefined;

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
        <span className="article-config-info-label">Gesamtbetrag</span>
        {showPrice ? (
          <span className="article-config-info-unit-price">
            (à {formatEur(product.unitPriceExclTax)})
          </span>
        ) : null}
        <div className="article-config-info-value-stack">
          {showPrice ? (
            <span className="article-config-info-price-pair">
              {showUvp && listTotal !== undefined ? (
                <span className="article-config-info-price-uvp">
                  {formatEur(listTotal)}
                </span>
              ) : null}
              <span className="article-config-info-price-current">
                {formatEur(totalPrice)}
              </span>
            </span>
          ) : (
            <span className="article-config-info-value">—</span>
          )}
          <span className="article-config-info-tax">
            zzgl. {taxRateLabel} % MwSt.
          </span>
        </div>
      </div>
    </div>
  );
}
