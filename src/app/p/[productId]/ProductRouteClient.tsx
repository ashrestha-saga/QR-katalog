"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FastRedirect } from "@/components/FastRedirect";
import { RoutingWizard } from "@/components/RoutingWizard";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { canLoadArticle, getCatalogSession } from "@/lib/catalog-session";
import { clearHaendlerCookie, getHaendlerCookie } from "@/lib/cookies";
import type { Product } from "@/lib/mock-data";
import { hasVariants } from "@/lib/oxid-variant-selection";

type Props = {
  product: Product;
  catalogSlug: string | null;
  fromScan: boolean;
  forceWizard?: boolean;
};

export function ProductRouteClient({
  product,
  catalogSlug,
  fromScan,
  forceWizard = false,
}: Props) {
  const router = useRouter();
  const [gate, setGate] = useState<"checking" | "allowed">("checking");
  const [mode, setMode] = useState<"loading" | "fast" | "wizard">("loading");

  useEffect(() => {
    const slug = catalogSlug ?? getCatalogSession() ?? DEFAULT_CATALOG_SLUG;
    const allowed = forceWizard || canLoadArticle(product.sku, slug, fromScan);

    if (!allowed) {
      router.replace(`/c/${slug}/scan`);
      return;
    }

    setGate("allowed");

    if (forceWizard || hasVariants(product)) {
      clearHaendlerCookie();
      setMode("wizard");
      return;
    }
    const cookie = getHaendlerCookie();
    setMode(cookie ? "fast" : "wizard");
  }, [product, catalogSlug, fromScan, forceWizard, router]);

  if (gate === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-quinary">
        Katalog-Session wird geprüft…
      </div>
    );
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-quinary">
        Artikel wird geladen…
      </div>
    );
  }

  if (mode === "fast") return <FastRedirect product={product} />;
  const resolvedCatalogSlug =
    catalogSlug ?? getCatalogSession() ?? DEFAULT_CATALOG_SLUG;
  return <RoutingWizard product={product} catalogSlug={resolvedCatalogSlug} />;
}
