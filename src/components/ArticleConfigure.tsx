"use client";

import { useEffect, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import {
  markArticleScanned,
  setCatalogSession,
} from "@/lib/catalog-session";
import type { Product } from "@/lib/mock-data";
import { WIZARD_ORDER_STEP } from "@/lib/wizard-config";
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
};

export function ArticleConfigure({ catalog, product }: Props) {
  const [existing, setExisting] = useState<ConfiguredCartLine | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    setCatalogSession(catalog.slug);
    markArticleScanned(product.sku);

    const existingLine = getCartLine(catalog.slug, product.sku) ?? null;
    setExisting(existingLine);
    setShowDuplicateWarning(Boolean(existingLine));
    setHydrated(true);
  }, [catalog.slug, product.sku]);

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle={`Artikel ${product.sku} ${
        existing ? "bearbeiten" : "konfigurieren"
      }`}
      brandBadge={`Schritt 1–${WIZARD_ORDER_STEP}`}
    >
      {!hydrated ? (
        <div className="flex min-h-[35vh] items-center justify-center text-sm text-quinary">
          Artikel wird geladen…
        </div>
      ) : (
        <>
          {existing && showDuplicateWarning && (
            <div className="geo-warn mb-4">
              <div className="flex items-start justify-between gap-3">
                <p>
                  Dieser Artikel ist bereits im Warenkorb. Du bearbeitest jetzt
                  den vorhandenen Eintrag. Beim Speichern wird die Menge im
                  Warenkorb aktualisiert.
                </p>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold text-secondary underline"
                  onClick={() => setShowDuplicateWarning(false)}
                >
                  OK
                </button>
              </div>
            </div>
          )}

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
