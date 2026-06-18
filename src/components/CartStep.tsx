"use client";

import type { Product } from "@/lib/mock-data";
import {
  calcLineTotals,
  formatEur,
  formatTaxRate,
} from "@/lib/pricing";
import { ProductSideSummary } from "./ProductSideSummary";
import { ProductThumb } from "./ProductThumb";

type Props = {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
};

export function CartStep({ product, quantity, onQuantityChange }: Props) {
  const totals = calcLineTotals(
    quantity,
    product.unitPriceExclTax,
    product.taxRate
  );

  function decrement() {
    onQuantityChange(Math.max(1, quantity - 1));
  }

  function increment() {
    onQuantityChange(Math.min(99, quantity + 1));
  }

  return (
    <>
      {/* Mobile: product card */}
      <div className="product-card-mobile md:hidden">
        <ProductSideSummary
          product={product}
          showEdition
          nameClassName="text-[15px] font-semibold text-secondary"
        />
        <div className="product-price-mobile mt-3">
          ab {formatEur(totals.totalInclTax / totals.quantity)}
        </div>
      </div>

      {/* Desktop: full cart */}
      <div className="verteilseite hidden md:block">
        <div className="product-banner">
          <ProductSideSummary
            product={product}
            thumb={
              <ProductThumb
                product={product}
                className="h-[60px] w-[60px] rounded-lg"
              />
            }
            showEdition
            nameClassName="text-base font-semibold text-secondary"
          />
          <div className="product-price-banner">
            ab {formatEur(totals.totalInclTax / totals.quantity)}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-secondary">Menge</span>
          <div className="quantity-control">
            <button
              type="button"
              onClick={decrement}
              disabled={quantity <= 1}
              className="quantity-btn"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={increment}
              disabled={quantity >= 99}
              className="quantity-btn"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="order-summary">
          <div className="summary-row">
            <span className="text-quinary">
              {formatEur(totals.unitPriceExclTax)} × {totals.quantity}
            </span>
            <span className="font-medium">{formatEur(totals.subtotalExclTax)}</span>
          </div>
          <div className="summary-row">
            <span className="text-quinary">{formatTaxRate(totals.taxRate)}</span>
            <span className="font-medium">{formatEur(totals.taxAmount)}</span>
          </div>
          <div className="summary-total">
            <span>Gesamt inkl. MwSt.</span>
            <span>{formatEur(totals.totalInclTax)}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-quinary">
          Preise sind im Prototyp indikativ. Endpreis wird im Händlershop bestätigt.
        </p>
      </div>

      <p className="info-box-mobile md:hidden">
        ℹ️ Dieses Produkt ist bei mehreren regionalen Händlern verfügbar.
      </p>
    </>
  );
}
