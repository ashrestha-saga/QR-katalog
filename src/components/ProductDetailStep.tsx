"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/mock-data";
import {
  formatVariantWithUnit,
  shouldShowShortDescription,
} from "@/lib/product-format";
import { ProductSideSummary } from "./ProductSideSummary";
import { VariantSelector } from "./VariantSelector";
import type { VariantSelectionState } from "@/hooks/useVariantSelection";

type Props = {
  product: Product;
  variantSelection?: VariantSelectionState | null;
};

type VariantSelectorProps = Pick<
  VariantSelectionState,
  | "labels"
  | "selectedValues"
  | "optionsByIndex"
  | "availableByIndex"
  | "onSelectValue"
>;

function ProductThumbnail({ product }: Props) {
  if (!product.thumbnailUrl) {
    return (
      <div className="product-thumb h-16 w-16 rounded-[14px] bg-white shadow-sm ring-1 ring-mercury md:h-[84px] md:w-[84px]">
        📦
      </div>
    );
  }

  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] border border-mercury bg-white shadow-sm md:h-[84px] md:w-[84px]">
      <img
        key={product.thumbnailUrl}
        src={product.thumbnailUrl}
        alt={`${product.name} Vorschaubild`}
        className="h-full w-full object-contain p-2"
      />
    </div>
  );
}

function ProductImageCarousel({ product }: Props) {
  const images = product.imageUrls ?? [];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product.thumbnailUrl, product.imageUrls?.join("|")]);

  if (images.length === 0) {
    return (
      <div className="flex h-64 w-full items-center justify-center rounded-[22px] border border-white/70 bg-gradient-to-br from-white to-porcelain text-6xl text-quinary shadow-inner md:h-[420px]">
        📦
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

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
    <div className="w-full">
      <div className="relative overflow-hidden rounded-[22px] border border-white/70 bg-gradient-to-br from-white via-white to-porcelain shadow-[0_18px_50px_rgba(10,22,40,0.10)]">
        <img
          key={activeImage}
          src={activeImage}
          alt={`${product.name} Produktbild ${activeIndex + 1}`}
          className="h-64 w-full object-contain p-5 md:h-[420px] md:p-8"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/70 to-transparent" />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Vorheriges Produktbild"
              className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mercury bg-white/95 text-2xl font-semibold text-secondary shadow-[0_8px_24px_rgba(10,22,40,0.16)] transition hover:scale-105 hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Nächstes Produktbild"
              className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mercury bg-white/95 text-2xl font-semibold text-secondary shadow-[0_8px_24px_rgba(10,22,40,0.16)] transition hover:scale-105 hover:bg-white"
            >
              ›
            </button>
          </>
        )}

        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3 rounded-full bg-secondary/80 px-3 py-1 text-xs font-medium text-white">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {hasMultipleImages && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Produktbild ${index + 1} anzeigen`}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex
                  ? "w-8 bg-accent-blue shadow-sm"
                  : "w-2.5 bg-mercury hover:bg-quinary/40"
              }`}
            />
          ))}
        </div>
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
  const hasMeta =
    shouldShowShortDescription(product) ||
    product.details ||
    product.modelType ||
    product.unitName ||
    product.categories?.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-secondary/55 p-0 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white shadow-[0_-20px_60px_rgba(10,22,40,0.24)] md:mx-auto md:max-w-5xl md:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-mercury bg-gradient-to-br from-white via-white to-accent-blue-bg px-5 pb-5 pt-5 md:px-7 md:pb-6 md:pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-quinary shadow-sm ring-1 ring-mercury">
                  Artikel {product.sku}
                </span>
                {product.modelType && (
                  <span className="rounded-full bg-accent-mint px-3 py-1 text-[11px] font-semibold text-secondary">
                    {product.modelType}
                  </span>
                )}
              </div>
              <h2
                id="product-detail-title"
                className="text-2xl font-semibold leading-tight md:text-3xl"
              >
                {product.name}
              </h2>
              {variantLine && (
                <p className="mt-1 text-sm font-medium text-secondary md:text-base">
                  {variantLine}
                </p>
              )}
              {shouldShowShortDescription(product) && (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-quinary md:text-base">
                  {product.shortDescription}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Produktdetails schließen"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-2xl leading-none text-secondary shadow-sm ring-1 ring-mercury transition hover:scale-105 hover:bg-porcelain"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-6 p-5 md:p-7">
          {variantSelection?.hasVariants ? (
            <VariantSelector
              labels={variantSelection.labels}
              selectedValues={variantSelection.selectedValues}
              optionsByIndex={variantSelection.optionsByIndex}
              availableByIndex={variantSelection.availableByIndex}
              onSelectValue={variantSelection.onSelectValue}
            />
          ) : null}

          <div className="rounded-[24px] bg-porcelain/70 p-3 md:p-4">
            <ProductImageCarousel product={product} />
          </div>

          <div className="grid gap-3 text-sm text-secondary md:grid-cols-2">
            {shouldShowShortDescription(product) && (
              <section className="rounded-[16px] border border-mercury bg-white p-4 shadow-sm md:col-span-2">
                <h3 className="mb-1 text-sm font-semibold">
                  Kurzbeschreibung
                </h3>
                <p className="leading-relaxed text-quinary">
                  {product.shortDescription}
                </p>
              </section>
            )}

            {product.description && (
              <section className="rounded-[16px] border border-mercury bg-white p-4 shadow-sm md:col-span-2">
                <h3 className="mb-1 text-sm font-semibold">
                  Beschreibung
                </h3>
                <p className="whitespace-pre-line leading-relaxed text-quinary">
                  {product.description}
                </p>
              </section>
            )}

            {product.details && product.details !== product.description && (
              <section className="rounded-[16px] border border-mercury bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold">Details</h3>
                <p className="leading-relaxed text-quinary">{product.details}</p>
              </section>
            )}

            {product.unitName && !product.variant ? (
              <section className="rounded-[16px] border border-mercury bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold">
                  Verpackungseinheit (VE)
                </h3>
                <p className="leading-relaxed text-quinary">
                  {product.unitName}
                </p>
              </section>
            ) : null}

            {product.categories && product.categories.length > 0 && (
              <section className="rounded-[16px] border border-mercury bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold">
                  Kategorien
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-accent-blue-bg px-3 py-1 text-xs font-medium text-accent-blue"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {!hasMeta && (
              <p className="rounded-[16px] border border-mercury bg-porcelain p-4 text-quinary">
                Keine weiteren Produktdetails verfügbar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductSummaryCard({ product }: Props) {
  return (
    <ProductSideSummary
      product={product}
      thumb={<ProductThumbnail product={product} />}
      showEdition
      showDeliveryScope
      showDetailsHint
    />
  );
}

/** Phase 1 — article info only (no quantity, VAT, or totals) */
export function ProductDetailStep({ product, variantSelection }: Props) {
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

  return (
    <>
      {selectorProps ? (
        <div className="mb-4 rounded-[16px] border border-mercury bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-secondary">
            Variante wählen
          </h3>
          <VariantSelector {...selectorProps} />
        </div>
      ) : null}

      {(product.thumbnailUrl || product.imageUrls?.length) ? (
        <div className="mb-4 rounded-[16px] border border-mercury bg-white p-3 shadow-sm md:p-4">
          <ProductImageCarousel
            key={product.thumbnailUrl ?? product.sku}
            product={product}
          />
        </div>
      ) : null}

      <div className="product-card-mobile md:hidden">
        <button
          type="button"
          className="w-full"
          onClick={() => setIsModalOpen(true)}
        >
          <ProductSummaryCard product={product} />
        </button>
      </div>

      <div className="verteilseite hidden md:block">
        <button
          type="button"
          className="product-banner w-full text-left transition hover:border-accent-blue-light hover:bg-accent-blue-bg"
          onClick={() => setIsModalOpen(true)}
        >
          <ProductSummaryCard product={product} />
        </button>
      </div>

      <p className="info-box-mobile mt-4 md:mt-0">
        ℹ️ Im nächsten Schritt wählst du Menge und schließt die Bestellung ab.
      </p>

      {isModalOpen && (
        <ProductDetailModal
          product={product}
          variantSelection={variantSelection}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
