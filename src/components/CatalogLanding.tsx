"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { Catalog } from "@/lib/catalog";
import { setCatalogSession } from "@/lib/catalog-session";
import { useCartCount } from "@/hooks/useCartCount";
import { CatalogAppShell } from "./CatalogAppShell";

type Props = {
  catalog: Catalog;
};

const STEPS = [
  "Artikel-QR im Printkatalog scannen oder die Bestellnummer eingeben",
  "Variante und Menge festlegen",
  "Artikel im Warenkorb speichern und Bestellung vorbereiten",
] as const;

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

function CatalogIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
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
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function CatalogLanding({ catalog }: Props) {
  const cartCount = useCartCount(catalog.slug);

  const catalogLabel = catalog.edition
    ? `${catalog.title} · Edition ${catalog.edition}`
    : catalog.title;

  useEffect(() => {
    setCatalogSession(catalog.slug);
  }, [catalog.slug]);

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle=""
      brandBadge=""
      unifiedCard
    >
      <div className="landing-page">
        <p className="scan-catalog-label">{catalogLabel}</p>
        <h1 className="scan-page-title">Katalog geöffnet</h1>
        <p className="scan-page-description">
          Du hast den Cover-QR gescannt. Scanne jetzt einen Artikel-QR im
          Katalog oder gib die Bestellnummer ein, um Produktdetails zu laden.
        </p>

        <section className="landing-hero-card" aria-label="Nächster Schritt">
          <div className="landing-hero-icon" aria-hidden>
            <CatalogIcon />
          </div>
          <p className="landing-hero-tagline">{catalog.tagline}</p>
          <div className="landing-hero-actions">
            <Link
              href={`/c/${catalog.slug}/scan`}
              className="cart-btn-primary landing-cta"
            >
              Artikel-QR scannen
              <ArrowRightIcon />
            </Link>
            {cartCount > 0 ? (
              <Link
                href={`/c/${catalog.slug}/cart`}
                className="cart-btn-outline landing-cta"
              >
                Zum Warenkorb ({cartCount})
              </Link>
            ) : null}
          </div>
        </section>

        <section className="landing-steps" aria-labelledby="landing-steps-title">
          <h2 id="landing-steps-title" className="landing-steps-title">
            So funktioniert&apos;s
          </h2>
          <ol className="landing-steps-list">
            {STEPS.map((step, index) => (
              <li key={step} className="landing-step">
                <span className="landing-step-number" aria-hidden>
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="scan-info-bar">
          <InfoIcon />
          <p>
            Artikeldetails werden erst nach dem Scan eines Artikel-QR oder der
            Eingabe einer Bestellnummer geladen — nicht über den Cover-QR.
          </p>
        </div>
      </div>
    </CatalogAppShell>
  );
}
