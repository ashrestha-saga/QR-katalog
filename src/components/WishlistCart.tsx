"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import { setCatalogSession } from "@/lib/catalog-session";
import { type Product } from "@/lib/mock-data";
import { WIZARD_HAENDLER_STEP_ENABLED } from "@/lib/wizard-config";
import { calcBasketTotals, calcLineTotals, formatEur } from "@/lib/pricing";
import {
  clearCart,
  getCartLine,
  getCartLines,
  removeCartLine,
  upsertCartLine,
  type ConfiguredCartLine,
} from "@/lib/wishlist-session";
import { CatalogAppShell } from "./CatalogAppShell";
import { ProductThumb } from "./ProductThumb";

type Props = {
  catalog: Catalog;
};

type RedirectEntry = {
  label: string;
  url: string;
};

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

type CartLineRowProps = {
  catalog: Catalog;
  line: ConfiguredCartLine;
  product: Product;
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
};

function CartLineRow({
  catalog,
  line,
  product,
  onQuantityChange,
  onRemove,
}: CartLineRowProps) {
  const lineTotals = calcLineTotals(
    line.quantity,
    product.unitPriceExclTax,
    product.taxRate
  );

  return (
    <li className="rounded-xl border border-mercury bg-porcelain p-4">
      <div className="flex gap-4">
        <div className="cart-line-thumb">
          <ProductThumb
            product={product}
            className="h-full w-full rounded-lg border-0 shadow-none"
            imageClassName="p-2"
          />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/c/${catalog.slug}/article/${line.sku}`}
            className="cart-line-title"
          >
            {product.name}
          </Link>
          {product.variant ? (
            <p className="text-[13px] font-medium text-secondary">
              {product.variant}
            </p>
          ) : null}
          <p className="cart-line-meta">
            Art. Nr. {line.sku}
            {product.shortDescription ? ` · ${product.shortDescription}` : null}
          </p>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div className="cart-line-actions">
              <button
                type="button"
                className="cart-remove-btn"
                onClick={() => onRemove(line.sku)}
                aria-label={`${product.name} entfernen`}
              >
                <TrashIcon />
              </button>
              <div className="cart-qty-control">
                <button
                  type="button"
                  className="cart-qty-btn"
                  disabled={line.quantity <= 1}
                  onClick={() => onQuantityChange(line.sku, line.quantity - 1)}
                  aria-label="Menge verringern"
                >
                  −
                </button>
                <span className="cart-qty-value">{line.quantity}</span>
                <button
                  type="button"
                  className="cart-qty-btn"
                  disabled={line.quantity >= 99}
                  onClick={() => onQuantityChange(line.sku, line.quantity + 1)}
                  aria-label="Menge erhöhen"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-6 text-right">
              <div>
                <span className="product-label block">Einzelpreis</span>
                <span className="text-sm font-medium text-secondary">
                  {formatEur(lineTotals.unitPriceExclTax)}
                </span>
              </div>
              <div>
                <span className="product-label block">Gesamtbetrag</span>
                <span className="text-sm font-medium text-secondary">
                  {formatEur(lineTotals.subtotalExclTax)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function WishlistCart({ catalog }: Props) {
  const [lines, setLines] = useState<ConfiguredCartLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [redirects, setRedirects] = useState<RedirectEntry[] | null>(null);

  const refreshLines = useCallback(() => {
    const nextLines = getCartLines(catalog.slug);
    setLines(nextLines);
    setProducts((current) => {
      const next = { ...current };
      for (const line of nextLines) {
        if (line.product) next[line.sku] = line.product;
      }
      return next;
    });
  }, [catalog.slug]);

  useEffect(() => {
    setCatalogSession(catalog.slug);
    refreshLines();
    setHydrated(true);
  }, [catalog.slug, refreshLines]);

  useEffect(() => {
    const missingSkus = lines
      .map((line) => line.sku)
      .filter((sku) => !products[sku]);

    if (missingSkus.length === 0) return;

    let cancelled = false;

    async function fetchMissingProducts() {
      const entries = await Promise.all(
        missingSkus.map(async (sku) => {
          try {
            const res = await fetch(`/api/articles/${encodeURIComponent(sku)}`, {
              cache: "no-store",
            });
            if (!res.ok) return null;
            const data = (await res.json()) as { product?: Product };
            return data.product ? ([sku, data.product] as const) : null;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      setProducts((current) => {
        const next = { ...current };
        for (const entry of entries) {
          if (entry) next[entry[0]] = entry[1];
        }
        return next;
      });
    }

    void fetchMissingProducts();

    return () => {
      cancelled = true;
    };
  }, [lines, products]);

  useEffect(() => {
    if (!redirects || redirects.length === 0) return;
    setRedirectFailed(false);
    setRedirectCountdown(3);
    setIsRedirecting(true);
  }, [redirects]);

  useEffect(() => {
    if (!redirects || redirects.length === 0 || !isRedirecting) return;

    if (redirectCountdown <= 0) {
      setIsRedirecting(false);
      const fallbackTimer = window.setTimeout(() => {
        setRedirectFailed(true);
      }, 1500);
      window.location.assign(redirects[0].url);
      return () => {
        window.clearTimeout(fallbackTimer);
      };
    }

    const timer = window.setTimeout(() => {
      setRedirectCountdown((current) => current - 1);
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [redirectCountdown, redirects, isRedirecting]);

  const basketTotals = useMemo(() => {
    const priced = lines
      .map((line) => {
        const product = products[line.sku] ?? line.product;
        if (!product) return null;
        return {
          quantity: line.quantity,
          unitPriceExclTax: product.unitPriceExclTax,
          taxRate: product.taxRate,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return calcBasketTotals(priced);
  }, [lines, products]);

  const taxRateLabel = useMemo(() => {
    const firstLine = lines.find(
      (line) => products[line.sku] ?? line.product
    );
    const product = firstLine
      ? products[firstLine.sku] ?? firstLine.product
      : null;
    const rate = product?.taxRate ?? 0.19;
    return Math.round(rate * 100);
  }, [lines, products]);

  function removeLine(sku: string) {
    removeCartLine(catalog.slug, sku);
    refreshLines();
  }

  function updateQuantity(sku: string, quantity: number) {
    const line = getCartLine(catalog.slug, sku);
    if (!line) return;

    upsertCartLine(catalog.slug, {
      sku: line.sku,
      quantity,
      product: products[sku] ?? line.product,
      haendlerId: line.haendlerId,
      region: line.region,
      remember: line.remember,
    });
    refreshLines();
  }

  const submitBasket = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/basket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog: catalog.slug,
          lines: lines.map((l) => {
            const product = products[l.sku] ?? l.product;
            return {
              product_id: l.sku,
              quantity: l.quantity,
              ...(product?.oxidId ? { oxid_id: product.oxidId } : {}),
              ...(WIZARD_HAENDLER_STEP_ENABLED && l.haendlerId
                ? { haendler: l.haendlerId }
                : {}),
            };
          }),
          remember: WIZARD_HAENDLER_STEP_ENABLED && lines.some((l) => l.remember),
        }),
      });

      const data = (await res.json()) as {
        redirect_urls?: Array<{
          url: string;
          label?: string;
          haendlerName?: string;
        }>;
        redirect_url?: string;
        error?: string;
      };

      if (!res.ok) {
        setSubmitError(data.error ?? "Warenkorb konnte nicht übergeben werden.");
        return;
      }

      const entries: RedirectEntry[] =
        data.redirect_urls?.map((entry) => ({
          label:
            entry.label ??
            entry.haendlerName ??
            (WIZARD_HAENDLER_STEP_ENABLED ? "Händler" : "Bestellung"),
          url: entry.url,
        })) ??
        (data.redirect_url ? [{ label: "Bestellung", url: data.redirect_url }] : []);

      if (entries.length === 0) {
        setSubmitError("Keine Shop-URL erhalten.");
        return;
      }

      clearCart(catalog.slug);
      setRedirects(entries);
    } catch {
      setSubmitError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }, [catalog.slug, lines, products]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-quinary">
        Warenkorb wird geladen…
      </div>
    );
  }

  if (redirects) {
    const primaryRedirect = redirects[0];
    return (
      <CatalogAppShell catalog={catalog} brandBadge="Fertig">
        <div className="stage-card">
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Weiterleitung zur Bestellung
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              {redirects.length}{" "}
              {redirects.length === 1 ? "Bestellung" : "Bestellungen"} übergeben.
            </p>
            <p className="mt-2 text-sm text-quinary">
              Du wirst jetzt direkt zum Shop weitergeleitet.
            </p>
            {isRedirecting && (
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-quinary">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-blue" />
                Weiterleitung in {redirectCountdown} Sekunden…
              </div>
            )}
            {redirectFailed && primaryRedirect ? (
              <p className="mt-3 text-sm text-quinary">
                Automatische Weiterleitung fehlgeschlagen.{" "}
                <a
                  href={primaryRedirect.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-blue underline"
                >
                  URL manuell öffnen
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </CatalogAppShell>
    );
  }

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle="Warenkorb"
      brandBadge={`${lines.length} Artikel`}
      footer={
        <Link href={`/c/${catalog.slug}/scan`} className="underline hover:text-secondary">
          Weiteren Artikel scannen
        </Link>
      }
    >
      <div className="stage-card">
        {lines.length === 0 ? (
          <div className="verteilseite text-center">
            <p className="text-4xl text-quinary" aria-hidden>
              🛒
            </p>
            <p className="mt-3 text-sm text-quinary">Noch keine Artikel im Warenkorb.</p>
            <Link
              href={`/c/${catalog.slug}/scan`}
              className="btn-primary mt-6 inline-block max-w-xs"
            >
              Ersten Artikel scannen
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {lines.map((line) => {
                const product = products[line.sku] ?? line.product;

                if (!product) {
                  return (
                    <li
                      key={line.sku}
                      className="rounded-xl border border-mercury bg-porcelain p-4"
                    >
                      <div className="product-label">Artikel {line.sku}</div>
                      <p className="text-sm text-quinary">
                        Artikeldaten werden geladen…
                      </p>
                    </li>
                  );
                }

                return (
                  <CartLineRow
                    key={line.sku}
                    catalog={catalog}
                    line={line}
                    product={product}
                    onQuantityChange={updateQuantity}
                    onRemove={removeLine}
                  />
                );
              })}
            </ul>

            <div className="cart-summary mt-6" aria-label="Bestellzusammenfassung">
              <h2 className="cart-summary-title">Zusammenfassung</h2>

              <div className="cart-summary-row">
                <span>Summe Artikel (netto)</span>
                <span>{formatEur(basketTotals.subtotalExclTax)}</span>
              </div>
              <div className="cart-summary-row">
                <span>zzgl. {taxRateLabel}% MwSt., Betrag:</span>
                <span>{formatEur(basketTotals.taxAmount)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Summe Artikel (brutto):</span>
                <span>{formatEur(basketTotals.totalInclTax)}</span>
              </div>

              <div className="cart-summary-total">
                <span>Gesamtbetrag:</span>
                <span>{formatEur(basketTotals.totalInclTax)}</span>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/c/${catalog.slug}/scan`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-primary bg-white px-5 py-3 text-center text-sm font-semibold text-primary transition hover:bg-porcelain"
                >
                  Weiteren Artikel scannen
                </Link>
                <button
                  type="button"
                  className="flex min-h-12 flex-1 items-center justify-center rounded-lg border border-primary bg-primary px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-primary-hover hover:bg-primary-hover disabled:opacity-50"
                  onClick={() => void submitBasket()}
                  disabled={submitting}
                >
                  {submitting ? "Wird übergeben…" : "Weiter zur Bestellung"}
                </button>
              </div>
              {submitError && <p className="geo-warn mt-3">{submitError}</p>}
            </div>
          </>
        )}
      </div>
    </CatalogAppShell>
  );
}
