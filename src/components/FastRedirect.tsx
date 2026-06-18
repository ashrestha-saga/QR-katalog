"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildTargetUrl, getHaendler, type Product } from "@/lib/mock-data";
import { getHaendlerCookie } from "@/lib/cookies";
import { AppShell } from "./AppShell";

type Props = {
  product: Product;
};

export function FastRedirect({ product }: Props) {
  const [haendlerId, setHaendlerId] = useState<string | null>(null);

  useEffect(() => {
    setHaendlerId(getHaendlerCookie());
  }, []);

  if (haendlerId === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-quinary">
        Gespeicherter Händler wird geprüft…
      </div>
    );
  }

  const h = getHaendler(haendlerId);
  const url = buildTargetUrl(haendlerId, product.sku, 1);

  return (
    <AppShell brandBadge="Fast-Path">
      <div className="stage-card">
        <div className="success-message">
          <div className="success-icon" aria-hidden>
            ⚡
          </div>
          <h2 className="text-lg font-semibold text-accent-success-text">
            Direkt-Weiterleitung
          </h2>
          <p className="mt-2 text-sm text-accent-success-muted">
            Gespeicherter Händler: <strong>{h?.name ?? haendlerId}</strong>
          </p>
          <p className="mt-1 text-sm text-accent-success-muted">{product.name}</p>
        </div>
        <p className="break-all rounded-lg bg-porcelain p-3 text-xs text-quinary">
          {url}
        </p>
        <p className="mt-3 text-xs text-quinary">
          Produktion: sofortiger HTTP 302. Menge standardmäßig 1 — im Wizard änderbar.
        </p>
        <div className="nav-buttons">
          <a href={url} className="btn-primary">
            Produkt im Shop öffnen
          </a>
          <Link href={`/p/${product.sku}?reset=1`} className="btn-secondary">
            Anderen Händler wählen
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
