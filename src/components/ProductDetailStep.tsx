"use client";

import { useEffect, useState } from "react";
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
  /** Menge for Gesamtpreis on the config card */
  quantity?: number;
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
  compact = false,
}: {
  product: Product;
  tall?: boolean;
  compact?: boolean;
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
      className={[
        "article-preview-card",
        tall ? "article-preview-card--tall" : "",
        compact ? "article-preview-card--modal" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="article-preview-header">
        <span className="article-preview-label">Vorschau</span>
        <span className="article-preview-live">
          <span className="article-preview-live-dot" aria-hidden />
          Live
        </span>
      </div>

      <div
        className={[
          "article-preview-stage",
          tall ? "article-preview-stage--tall" : "",
          compact ? "article-preview-stage--modal" : "",
          compact && !hasMultipleImages ? "article-preview-stage--modal-single" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {activeImage ? (
          <img
            key={activeImage}
            src={activeImage}
            alt={`${product.name} Produktbild ${activeIndex + 1}`}
            className={[
              "article-preview-image",
              tall ? "article-preview-image--tall" : "",
              compact ? "article-preview-image--modal" : "",
            ]
              .filter(Boolean)
              .join(" ")}
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
              className={[
                "article-preview-nav article-preview-nav-prev",
                compact ? "article-preview-nav--modal" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Nächstes Produktbild"
              className={[
                "article-preview-nav article-preview-nav-next",
                compact ? "article-preview-nav--modal" : "",
              ]
                .filter(Boolean)
                .join(" ")}
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

function InfoIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
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
        <InfoIcon />
        Produktdetails ansehen
      </button>
    </div>
  );
}

function ProductFeatureHtml({ html }: { html: string }) {
  return (
    <section className="product-feature-block">
      <h3 className="product-feature-heading">Eigenschaft</h3>
      <div
        className="product-feature-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}

function ProductDetailCopy({ product }: { product: Product }) {
  const hasMeta =
    shouldShowShortDescription(product) ||
    product.descriptionHtml ||
    product.details ||
    product.modelType ||
    product.unitName ||
    product.categories?.length;

  return (
    <div className="product-detail-modal-copy">
      {shouldShowShortDescription(product) && (
        <section className="rounded-xl p-2">
          <h3 className="mb-1 text-sm font-semibold">Kurzbeschreibung</h3>
          <p className="leading-relaxed text-black">
            {product.shortDescription}
          </p>
        </section>
      )}

      {product.descriptionHtml ? (
        <section className="rounded-xl p-2">
          <h3 className="mb-1 text-sm font-semibold">Beschreibung</h3>
          <div
            className="product-description-body"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </section>
      ) : null}

      {product.details && product.details !== product.description && (
        <section className="rounded-xl p-2">
          <h3 className="mb-1 text-sm font-semibold">Details</h3>
          <p className="leading-relaxed text-black">{product.details}</p>
        </section>
      )}

      {product.unitName && !product.variant ? (
        <section className="rounded-xl p-2">
          <h3 className="mb-1 text-sm font-semibold">
            Verpackungseinheit (VE)
          </h3>
          <p className="leading-relaxed text-quinary">{product.unitName}</p>
        </section>
      ) : null}

      {product.categories && product.categories.length > 0 && (
        <section className="rounded-xl border border-mercury bg-quaternary p-3">
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
  const hasVariants = variantSelection?.hasVariants ?? false;
  const featureHtml = product.featureHtml?.trim();
  const showDetailsBelow = hasVariants || Boolean(featureHtml);

  return (
    <div
      className="inquiry-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      onMouseDown={onClose}
    >
      <div
        className="inquiry-modal-panel product-detail-modal-panel"
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
          <div className="product-detail-modal-split">
            <div className="product-detail-modal-media">
              <ProductImageCarousel product={product} compact />
            </div>
            <div className="product-detail-modal-config">
              {hasVariants && variantSelection ? (
                <>
                  {featureHtml ? (
                    <ProductFeatureHtml html={featureHtml} />
                  ) : null}
                  <VariantSelector
                    labels={variantSelection.labels}
                    selectedValues={variantSelection.selectedValues}
                    optionsByIndex={variantSelection.optionsByIndex}
                    availableByIndex={variantSelection.availableByIndex}
                    onSelectValue={variantSelection.onSelectValue}
                  />
                </>
              ) : featureHtml ? (
                <ProductFeatureHtml html={featureHtml} />
              ) : (
                <ProductDetailCopy product={product} />
              )}
            </div>
          </div>
          {showDetailsBelow ? <ProductDetailCopy product={product} /> : null}
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
  quantity = 1,
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
              quantity={quantity}
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
