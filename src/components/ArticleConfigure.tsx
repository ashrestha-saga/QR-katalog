"use client";

import { useEffect, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import {
  markArticleScanned,
  setCatalogSession,
} from "@/lib/catalog-session";
import type { Product } from "@/lib/mock-data";
import {
  getCartLine,
  upsertCartLine,
  type ConfiguredCartLine,
} from "@/lib/wishlist-session";
import { CatalogAppShell } from "./CatalogAppShell";
import { RoutingWizard } from "./RoutingWizard";

type Props = {
  catalog: Catalog;
  product: Product;
  /** Cart line SKU when editing an existing entry from the Warenkorb */
  editCartSku?: string;
};

export function ArticleConfigure({ catalog, product, editCartSku }: Props) {
  const [existing, setExisting] = useState<ConfiguredCartLine | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    setCatalogSession(catalog.slug);
    markArticleScanned(product.sku);

    const lineSku = editCartSku ?? product.sku;
    const existingLine = getCartLine(catalog.slug, lineSku) ?? null;
    setExisting(existingLine);
    setShowDuplicateWarning(Boolean(existingLine));
    setHydrated(true);
  }, [catalog.slug, product.sku, editCartSku]);

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle=""
      brandBadge=""
      unifiedCard
    >
      {!hydrated ? (
        <div className="flex min-h-[35vh] items-center justify-center text-sm text-quinary">
          Artikel wird geladen…
        </div>
      ) : (
        <>
          {existing && showDuplicateWarning ? (
            <div className="article-cart-edit-notice mb-5" role="status">
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
              <div className="min-w-0 flex-1">
                <p>
                  Dieser Artikel ist bereits im Warenkorb ({existing.quantity}×).
                  Beim Speichern wird der bestehende Eintrag bearbeitet.
                </p>
              </div>
              <button
                type="button"
                className="shrink-0 text-sm font-semibold text-primary hover:underline"
                onClick={() => setShowDuplicateWarning(false)}
              >
                OK
              </button>
            </div>
          ) : null}

          <RoutingWizard
            product={product}
            initialSelection={existing ?? undefined}
            wishlistMode
            catalogSlug={catalog.slug}
            useShell={false}
            onSaveToCart={(config) => {
              upsertCartLine(catalog.slug, config);
            }}
          />
        </>
      )}
    </CatalogAppShell>
  );
}
