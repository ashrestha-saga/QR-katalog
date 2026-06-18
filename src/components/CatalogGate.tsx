"use client";

import Link from "next/link";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { AppShell } from "./AppShell";

type Props = {
  productSku: string;
  reason: "no-catalog" | "scan-required";
  catalogSlug?: string | null;
};

export function CatalogGate({ productSku, reason, catalogSlug }: Props) {
  const slug = catalogSlug ?? DEFAULT_CATALOG_SLUG;

  return (
    <AppShell brandBadge="Hinweis">
      <div className="stage-card">
        <div className="verteilseite text-center">
          <div className="product-thumb mx-auto mb-4">📖</div>
          <h1 className="text-lg font-semibold">
            {reason === "no-catalog"
              ? "Zuerst den Katalog öffnen"
              : "Artikel-QR scannen"}
          </h1>
          <p className="mt-3 text-sm text-quinary">
            {reason === "no-catalog" ? (
              <>
                Artikel <span className="font-mono text-secondary">{productSku}</span> ist
                erst nach dem <strong>Katalog-Cover-QR</strong> und Scan des
                Artikel-QR im Katalog verfügbar.
              </>
            ) : (
              <>
                Katalog-Session aktiv, aber Artikel{" "}
                <span className="font-mono text-secondary">{productSku}</span> wurde noch
                nicht gescannt. Bitte den QR neben dem Produkt scannen.
              </>
            )}
          </p>
          <div className="nav-buttons mt-6">
            <Link href={`/c/${slug}`} className="btn-primary">
              Zum Katalog
            </Link>
            <Link href={`/c/${slug}/scan`} className="btn-secondary">
              Artikel-QR scannen
            </Link>
          </div>
          <p className="mt-6 text-xs text-quinary">
            <Link
              href={`/p/${productSku}?catalog=${slug}&from=scan`}
              className="underline hover:text-secondary"
            >
              Dev-Shortcut: Scan überspringen
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
