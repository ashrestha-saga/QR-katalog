"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Catalog } from "@/lib/catalog";
import { setCatalogSession } from "@/lib/catalog-session";
import { CatalogAppShell } from "./CatalogAppShell";

type Props = {
  catalog: Catalog;
};

export function CatalogLanding({ catalog }: Props) {
  useEffect(() => {
    setCatalogSession(catalog.slug);
  }, [catalog.slug]);

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle={
        catalog.edition
          ? `${catalog.title} · Edition ${catalog.edition}`
          : catalog.title
      }
    >
      <div className="stage-card">
        <p className="step-description">
          Du hast den <strong>Katalog-Cover-QR</strong> gescannt. Artikeldetails
          werden erst nach dem Scan eines Artikel-QR im Katalog geladen.
        </p>
        <div className="verteilseite text-center">
          <div className="product-thumb mx-auto mb-4">📖</div>
          <p className="text-sm text-quinary">{catalog.tagline}</p>
          <Link
            href={`/c/${catalog.slug}/scan`}
            className="btn-primary mt-6 flex min-h-[52px] items-center justify-center gap-2"
          >
            <span aria-hidden>📷</span>
            Artikel-QR scannen
          </Link>
        </div>
      </div>
    </CatalogAppShell>
  );
}
