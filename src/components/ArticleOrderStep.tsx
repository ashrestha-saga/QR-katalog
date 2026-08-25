"use client";

import type { Product } from "@/lib/mock-data";
import { type LineTotals, formatEur } from "@/lib/pricing";
import { ProductSideSummary } from "./ProductSideSummary";
import { ProductThumb } from "./ProductThumb";

type Props = {
  product: Product;
  quantity: number;
  lineTotals: LineTotals;
  onQuantityChange: (quantity: number) => void;
  onBack: () => void;
  onSave: () => void;
  saveLabel?: string;
  infoText?: string;
};

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-primary"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function ArticleOrderStep({
  product,
  quantity,
  lineTotals,
  onQuantityChange,
  onBack,
  onSave,
  saveLabel = "In Warenkorb speichern",
  infoText = "Deine Auswahl wird im Warenkorb gespeichert. Du wirst danach direkt zum Warenkorb weitergeleitet.",
}: Props) {
  const taxRateLabel = Math.round(lineTotals.taxRate * 100);

  return (
    <div className="article-order-layout">
      <div className="article-order-main">
        <div className="article-order-product-card">
          <ProductSideSummary
            product={product}
            thumb={
              <ProductThumb
                product={product}
                className="article-order-thumb"
              />
            }
            nameClassName="article-product-name"
          />
        </div>

        <div className="article-quantity-row">
          <span className="article-variant-label">Menge</span>
          <div className="cart-qty-control">
            <button
              type="button"
              className="cart-qty-btn"
              disabled={quantity <= 1}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              aria-label="Menge verringern"
            >
              −
            </button>
            <span className="cart-qty-value">{quantity}</span>
            <button
              type="button"
              className="cart-qty-btn"
              disabled={quantity >= 99}
              onClick={() => onQuantityChange(Math.min(99, quantity + 1))}
              aria-label="Menge erhöhen"
            >
              +
            </button>
          </div>
        </div>

        <div className="article-order-info">
          <InfoIcon />
          <p>{infoText}</p>
        </div>
      </div>

      <aside className="article-order-sidebar" aria-label="Preisübersicht">
        <div className="article-order-summary">
          <div className="article-order-summary-row">
            <span>Produktpreis ({quantity} ×)</span>
            <span>{formatEur(lineTotals.subtotalExclTax)}</span>
          </div>
          <div className="article-order-summary-row">
            <span>{taxRateLabel} % MwSt.</span>
            <span>{formatEur(lineTotals.taxAmount)}</span>
          </div>
          <div className="article-order-summary-total">
            <span>Gesamt</span>
            <span>{formatEur(lineTotals.totalInclTax)}</span>
          </div>
        </div>

        <div className="article-order-actions">
          <button
            type="button"
            className="cart-btn-outline article-order-back-btn"
            onClick={onBack}
          >
            <ArrowLeftIcon />
            Zurück
          </button>
          <button
            type="button"
            className="cart-btn-primary article-order-save-btn"
            onClick={onSave}
          >
            {saveLabel}
            <ArrowRightIcon />
          </button>
        </div>
      </aside>
    </div>
  );
}
