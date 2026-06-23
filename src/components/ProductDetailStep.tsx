"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/lib/mock-data";
import {
  formatVariantWithUnit,
  shouldShowShortDescription,
} from "@/lib/product-format";
import { ArticleConfigInfoCard } from "./ArticleConfigInfoCard";
import { ProductSideSummary } from "./ProductSideSummary";
import { VariantSelector } from "./VariantSelector";
import type { VariantSelectionState } from "@/hooks/useVariantSelection";

type Props = {
  product: Product;
  variantSelection?: VariantSelectionState | null;
  children?: React.ReactNode;
  /** Equal 50/50 columns with a larger preview — article configure step 1 */
  balancedLayout?: boolean;
};

type VariantSelectorProps = Pick<
  VariantSelectionState,
  | "labels"
  | "selectedValues"
  | "optionsByIndex"
  | "availableByIndex"
  | "onSelectValue"
>;

function ProductImageCarousel({
  product,
  tall = false,
}: {
  product: Product;
  tall?: boolean;
}) {
  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.thumbnailUrl
        ? [product.thumbnailUrl]
        : [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product.thumbnailUrl, product.imageUrls?.join("|")]);

  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];

  function goToPrevious() {
    setActiveIndex((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function goToNext() {
    setActiveIndex((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  return (
    <div
      className={
        tall ? "article-preview-card article-preview-card--tall" : "article-preview-card"
      }
    >
      <div className="article-preview-header">
        <span className="article-preview-label">Vorschau</span>
        <span className="article-preview-live">
          <span className="article-preview-live-dot" aria-hidden />
          Live
        </span>
      </div>

      <div
        className={
          tall ? "article-preview-stage article-preview-stage--tall" : "article-preview-stage"
        }
      >
        {activeImage ? (
          <img
            key={activeImage}
            src={activeImage}
            alt={`${product.name} Produktbild ${activeIndex + 1}`}
            className={
              tall ? "article-preview-image article-preview-image--tall" : "article-preview-image"
            }
          />
        ) : (
          <div className="article-preview-placeholder" aria-hidden>
            📦
          </div>
        )}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Vorheriges Produktbild"
              className="article-preview-nav article-preview-nav-prev"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Nächstes Produktbild"
              className="article-preview-nav article-preview-nav-next"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="article-preview-dots">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Produktbild ${index + 1} anzeigen`}
              className={
                index === activeIndex
                  ? "article-preview-dot article-preview-dot-active"
                  : "article-preview-dot"
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ArticleProductCard({
  product,
  onOpenDetails,
}: {
  product: Product;
  onOpenDetails: () => void;
}) {
  return (
    <div className="article-product-card">
      <ProductSideSummary
        product={product}
        showThumb={false}
        compact
        nameClassName="article-product-name"
      />
      <button
        type="button"
        className="article-product-details-link"
        onClick={onOpenDetails}
      >
        Produktdetails ansehen
      </button>
    </div>
  );
}

function ProductDetailModal({
  product,
  variantSelection,
  onClose,
}: Props & { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const variantLine = formatVariantWithUnit(product);
  const hasMeta =
    shouldShowShortDescription(product) ||
    product.details ||
    product.modelType ||
    product.unitName ||
    product.categories?.length;

  return (
    <div
      className="inquiry-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      onMouseDown={onClose}
    >
      <div
        className="inquiry-modal-panel md:max-w-3xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="inquiry-modal-header">
          <div className="min-w-0">
            <p className="inquiry-modal-label">Produktdetails</p>
            <h2
              id="product-detail-title"
              className="inquiry-modal-title"
            >
              {product.name}
            </h2>
            {variantLine ? (
              <p className="inquiry-modal-intro">{variantLine}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Produktdetails schließen"
            className="inquiry-modal-close"
          >
            ×
          </button>
        </header>

        <div className="inquiry-modal-body space-y-5">
          {variantSelection?.hasVariants ? (
            <VariantSelector
              labels={variantSelection.labels}
              selectedValues={variantSelection.selectedValues}
              optionsByIndex={variantSelection.optionsByIndex}
              availableByIndex={variantSelection.availableByIndex}
              onSelectValue={variantSelection.onSelectValue}
            />
          ) : null}

          <ProductImageCarousel product={product} />

          <div className="grid gap-3 text-sm text-secondary">
            {shouldShowShortDescription(product) && (
              <section className="rounded-xl border border-mercury bg-cart-line p-4">
                <h3 className="mb-1 text-sm font-semibold">Kurzbeschreibung</h3>
                <p className="leading-relaxed text-quinary">
                  {product.shortDescription}
                </p>
              </section>
            )}

            {product.description && (
              <section className="rounded-xl border border-mercury bg-cart-line p-4">
                <h3 className="mb-1 text-sm font-semibold">Beschreibung</h3>
                <p className="whitespace-pre-line leading-relaxed text-quinary">
                  {product.description}
                </p>
              </section>
            )}

            {product.details && product.details !== product.description && (
              <section className="rounded-xl border border-mercury bg-cart-line p-4">
                <h3 className="mb-1 text-sm font-semibold">Details</h3>
                <p className="leading-relaxed text-quinary">{product.details}</p>
              </section>
            )}

            {product.unitName && !product.variant ? (
              <section className="rounded-xl border border-mercury bg-cart-line p-4">
                <h3 className="mb-1 text-sm font-semibold">
                  Verpackungseinheit (VE)
                </h3>
                <p className="leading-relaxed text-quinary">{product.unitName}</p>
              </section>
            ) : null}

            {product.categories && product.categories.length > 0 && (
              <section className="rounded-xl border border-mercury bg-cart-line p-4">
                <h3 className="mb-2 text-sm font-semibold">Kategorien</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-accent-mint px-3 py-1 text-xs font-medium text-primary"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {!hasMeta && (
              <p className="rounded-xl border border-mercury bg-cart-line p-4 text-quinary">
                Keine weiteren Produktdetails verfügbar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Phase 1 — article info + variant selection */
export function ProductDetailStep({
  product,
  variantSelection,
  children,
  balancedLayout = false,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const selectorProps: VariantSelectorProps | null =
    variantSelection?.hasVariants
      ? {
          labels: variantSelection.labels,
          selectedValues: variantSelection.selectedValues,
          optionsByIndex: variantSelection.optionsByIndex,
          availableByIndex: variantSelection.availableByIndex,
          onSelectValue: variantSelection.onSelectValue,
        }
      : null;

  const hasVariants = variantSelection?.hasVariants ?? false;

  return (
    <>
      <div
        className={[
          "article-step-layout",
          hasVariants ? "" : "article-step-layout--simple",
          balancedLayout ? "article-step-layout--balanced" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="article-step-media">
          <ProductImageCarousel product={product} tall={!hasVariants} />

          {hasVariants ? (
            <ArticleProductCard
              product={product}
              onOpenDetails={() => setIsModalOpen(true)}
            />
          ) : null}
        </div>

        {selectorProps || children || !hasVariants ? (
          <div className="article-step-config">
            {!hasVariants ? (
              <ArticleProductCard
                product={product}
                onOpenDetails={() => setIsModalOpen(true)}
              />
            ) : null}
            {selectorProps ? <VariantSelector {...selectorProps} /> : null}
            <ArticleConfigInfoCard
              product={product}
              hasVariants={hasVariants}
              isComplete={variantSelection?.isVariantSelectionComplete ?? true}
              selectedVariant={variantSelection?.selectedVariant}
            />
            {children}
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <ProductDetailModal
          product={product}
          variantSelection={variantSelection}
          onClose={() => setIsModalOpen(false)}
        />
      ) : null}
    </>
  );
}
