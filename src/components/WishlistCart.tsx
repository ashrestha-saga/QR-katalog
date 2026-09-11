"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import { setCatalogSession } from "@/lib/catalog-session";
import { type Product } from "@/lib/mock-data";
import { requestScanGrant } from "@/lib/request-scan-grant";
import { WIZARD_HAENDLER_STEP_ENABLED } from "@/lib/wizard-config";
import {
  calcBasketTotalsWithShipping,
  calcLineTotals,
  formatEur,
} from "@/lib/pricing";
import {
  buildCartLineEditHref,
  clearCart,
  consumeCartAddedToast,
  getCartLine,
  getCartLines,
  removeCartLine,
  upsertCartLine,
  type CartAddedToast,
  type ConfiguredCartLine,
} from "@/lib/wishlist-session";
import { isShopCheckoutEnabled } from "@/lib/order-mode";
import { formatVeLabel, shouldShowShortDescription } from "@/lib/product-format";
import { CatalogAppShell } from "./CatalogAppShell";
import { OrderInquiryModal, type InquiryLine } from "./OrderInquiryModal";
import { ProductThumb } from "./ProductThumb";

function formatArticleMeta(product: Product): string {
  const ve = formatVeLabel(product.unitName);
  return ve
    ? `Art. Nr. ${product.sku} · ${ve}`
    : `Art. Nr. ${product.sku}`;
}

type Props = {
  catalog: Catalog;
};

type RedirectEntry = {
  label: string;
  url: string;
};

const SHOP_CHECKOUT_NOTE =
  "Mit Klick auf „Weiter zur Bestellung“ werden die für die Bearbeitung Ihrer Bestellung erforderlichen Daten an das Shopsystem übertragen. Die Verarbeitung erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO. Es werden keine zusätzlichen personenbezogenen Daten erhoben.";

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

type CartLineRowProps = {
  line: ConfiguredCartLine;
  product: Product;
  onQuantityChange: (sku: string, quantity: number) => void;
  onRemove: (sku: string) => void;
  onEdit: (line: ConfiguredCartLine) => void;
  editBusySku: string | null;
};

function CartLineRow({
  line,
  product,
  onQuantityChange,
  onRemove,
  onEdit,
  editBusySku,
}: CartLineRowProps) {
  const lineTotals = calcLineTotals(
    line.quantity,
    product.unitPriceExclTax,
    product.taxRate
  );
  const variantLine =
    product.variant?.trim() ||
    (shouldShowShortDescription(product) ? product.shortDescription?.trim() : null);
  const editing = editBusySku === line.sku;

  return (
    <li className="cart-line-card">
      <div className="cart-line-top">
        <div className="cart-line-thumb">
          <ProductThumb
            product={product}
            className="h-full w-full rounded-lg border-0 shadow-none"
          />
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="cart-line-title text-left"
            disabled={editing}
            onClick={() => onEdit(line)}
          >
            {editing ? "Wird geladen…" : product.name}
          </button>
          {variantLine ? (
            <p className="cart-line-variant">{variantLine}</p>
          ) : null}
          <p className="cart-line-meta">{formatArticleMeta(product)}</p>
        </div>
      </div>

      <div className="cart-line-bottom">
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

        <span className="cart-line-unit-price">
          (à {formatEur(lineTotals.unitPriceExclTax)})
        </span>

        <div className="cart-line-pricing">
          <span className="cart-line-total-price">
            {formatEur(lineTotals.subtotalExclTax)}
          </span>
        </div>

        <button
          type="button"
          className="cart-remove-btn"
          onClick={() => onRemove(line.sku)}
          aria-label={`${product.name} entfernen`}
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

type CartSummaryProps = {
  catalog: Catalog;
  basketTotals: ReturnType<typeof calcBasketTotalsWithShipping>;
  taxRateLabel: number;
  shopCheckoutEnabled: boolean;
  submitting: boolean;
  submitError: string | null;
  onCheckoutClick: () => void;
};

function CartSummary({
  catalog,
  basketTotals,
  taxRateLabel,
  shopCheckoutEnabled,
  submitting,
  submitError,
  onCheckoutClick,
}: CartSummaryProps) {
  const checkoutLabel = shopCheckoutEnabled
    ? "Weiter zur Bestellung"
    : "Anfrage per E-Mail senden";

  return (
    <aside className="cart-sidebar" aria-label="Bestellzusammenfassung">
      <div className="cart-summary-card">
        <h2 className="cart-summary-title">Zusammenfassung</h2>

        <div className="cart-summary-row">
          <span>Summe Artikel (netto)</span>
          <span>{formatEur(basketTotals.subtotalExclTax)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Versand (netto)</span>
          <span className="font-semibold text-primary">
            {basketTotals.shippingNet > 0
              ? formatEur(basketTotals.shippingNet)
              : "Kostenlos"}
          </span>
        </div>
        <div className="cart-summary-row">
          <span>zzgl. {taxRateLabel} % MwSt.</span>
          <span>{formatEur(basketTotals.taxAmount)}</span>
        </div>

        <div className="cart-summary-total">
          <span>Gesamtbetrag</span>
          <span>{formatEur(basketTotals.totalInclTax)}</span>
        </div>
      </div>

      <div className="cart-actions-block">
        <div className="cart-actions">
          <Link
            href={`/c/${catalog.slug}/scan`}
            className="cart-btn-outline"
          >
            Weiteren Artikel scannen
          </Link>
          <button
            type="button"
            className="cart-btn-primary"
            onClick={onCheckoutClick}
            disabled={submitting}
          >
            {submitting ? "Wird übergeben…" : checkoutLabel}
            {!submitting ? <ArrowRightIcon /> : null}
          </button>
        </div>

        <p className="cart-checkout-note">
        {shopCheckoutEnabled ? <><span className="font-bold">Datenschutzhinweis: </span> {SHOP_CHECKOUT_NOTE}</> : ""}
        </p>

        {submitError ? <p className="geo-warn">{submitError}</p> : null}
      </div>
    </aside>
  );
}

export function WishlistCart({ catalog }: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<ConfiguredCartLine[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [redirectFailed, setRedirectFailed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [redirects, setRedirects] = useState<RedirectEntry[] | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [addedToast, setAddedToast] = useState<CartAddedToast | null>(null);
  const [editBusySku, setEditBusySku] = useState<string | null>(null);
  const shopCheckoutEnabled = isShopCheckoutEnabled();

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

  const editCartLine = useCallback(
    async (line: ConfiguredCartLine) => {
      const parentSku = line.product?.parentSku ?? line.sku;
      setEditBusySku(line.sku);
      try {
        const result = await requestScanGrant(catalog.slug, parentSku);
        if (!result.ok) {
          setSubmitError(
            "Artikel konnte nicht zum Bearbeiten geladen werden. Bitte erneut scannen."
          );
          return;
        }
        if (line.sku !== parentSku) {
          await requestScanGrant(catalog.slug, line.sku);
        }
        router.push(buildCartLineEditHref(catalog.slug, line));
      } catch {
        setSubmitError("Netzwerkfehler beim Öffnen des Artikels.");
      } finally {
        setEditBusySku(null);
      }
    },
    [catalog.slug, router]
  );

  useEffect(() => {
    setCatalogSession(catalog.slug);
    refreshLines();
    setHydrated(true);
    const toast = consumeCartAddedToast(catalog.slug);
    if (toast) setAddedToast(toast);
  }, [catalog.slug, refreshLines]);

  useEffect(() => {
    if (!addedToast) return;
    const timer = window.setTimeout(() => setAddedToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [addedToast]);

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
            const grant = await requestScanGrant(catalog.slug, sku);
            if (!grant.ok || !grant.product) return null;
            return [sku, grant.product as Product] as const;
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
  }, [lines, products, catalog.slug]);

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

  const shippingTaxRate = useMemo(() => {
    const firstLine = lines.find(
      (line) => products[line.sku] ?? line.product
    );
    const product = firstLine
      ? products[firstLine.sku] ?? firstLine.product
      : null;
    return product?.taxRate ?? 0.19;
  }, [lines, products]);

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
    return calcBasketTotalsWithShipping(priced, shippingTaxRate);
  }, [lines, products, shippingTaxRate]);

  const taxRateLabel = Math.round(shippingTaxRate * 100);

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
              product_id: product?.sku ?? l.sku,
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

  const inquiryLines: InquiryLine[] = useMemo(
    () =>
      lines.map((line) => {
        const product = products[line.sku] ?? line.product;
        return {
          sku: product?.sku ?? line.sku,
          quantity: line.quantity,
          product,
        };
      }),
    [lines, products]
  );

  function handleCheckoutClick() {
    if (shopCheckoutEnabled) {
      void submitBasket();
      return;
    }
    setShowInquiryModal(true);
  }

  function handleInquirySuccess() {
    clearCart(catalog.slug);
    setShowInquiryModal(false);
    setInquirySubmitted(true);
    refreshLines();
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-quinary">
        Warenkorb wird geladen…
      </div>
    );
  }

  if (inquirySubmitted) {
    return (
      <CatalogAppShell catalog={catalog} brandSubtitle="" brandBadge="" unifiedCard>
        <div className="cart-page">
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Anfrage gesendet
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              Vielen Dank — Ihre Anfrage wurde per E-Mail an unser Service-Team
              übermittelt. Wir speichern keine Informationen in dieser App.
            </p>
          </div>
          <div className="cart-actions mt-6">
            <Link href={`/c/${catalog.slug}/scan`} className="cart-btn-primary">
              Weiteren Artikel scannen
            </Link>
            <Link href={`/c/${catalog.slug}`} className="cart-btn-outline">
              Zur Startseite
            </Link>
          </div>
        </div>
      </CatalogAppShell>
    );
  }

  if (redirects) {
    const primaryRedirect = redirects[0];
    return (
      <CatalogAppShell catalog={catalog} brandSubtitle="" brandBadge="" unifiedCard>
        <div className="cart-page">
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Weiterleitung zum Shopsystem
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              {redirects.length}{" "}
              {redirects.length === 1 ? "Bestellung" : "Bestellungen"} übergeben.
            </p>
            <p className="mt-2 text-sm text-quinary">
              Sie werden jetzt direkt zum Warenkorb des Shopsystems
              weitergeleitet. Wir speichern keinerlei Informationen auf unserer
              Seite.
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
                  Shop manuell öffnen
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </CatalogAppShell>
    );
  }

  return (
    <>
      {showInquiryModal ? (
        <OrderInquiryModal
          catalogSlug={catalog.slug}
          lines={inquiryLines}
          onClose={() => setShowInquiryModal(false)}
          onSuccess={handleInquirySuccess}
        />
      ) : null}

      <CatalogAppShell
        catalog={catalog}
        brandSubtitle=""
        brandBadge=""
        unifiedCard
      >
        <div className="cart-page">
          {addedToast ? (
            <div className="cart-toast" role="status" aria-live="polite">
              <span className="cart-toast-icon" aria-hidden>
                ✓
              </span>
              <div className="min-w-0">
                <p className="cart-toast-title">Artikel hinzugefügt</p>
                <p className="cart-toast-detail">
                  {addedToast.quantity}× {addedToast.productName}
                </p>
              </div>
              <button
                type="button"
                className="cart-toast-dismiss"
                onClick={() => setAddedToast(null)}
                aria-label="Hinweis schließen"
              >
                ×
              </button>
            </div>
          ) : null}

          <p className="cart-page-label">Warenkorb</p>
          <h1 className="cart-page-title">Dein Warenkorb</h1>

          {lines.length === 0 ? (
            <div className="cart-empty">
              <p className="text-4xl text-quinary" aria-hidden>
                🛒
              </p>
              <p className="mt-3 text-sm text-quinary">
                Noch keine Artikel im Warenkorb.
              </p>
              <Link
                href={`/c/${catalog.slug}/scan`}
                className="cart-btn-primary mt-6 inline-flex max-w-xs"
              >
                Ersten Artikel scannen
              </Link>
            </div>
          ) : (
            <div className="cart-page-layout">
              <ul className="cart-lines-list">
                {lines.map((line) => {
                  const product = products[line.sku] ?? line.product;

                  if (!product) {
                    return (
                      <li key={line.sku} className="cart-line-card">
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
                      line={line}
                      product={product}
                      onQuantityChange={updateQuantity}
                      onRemove={removeLine}
                      onEdit={editCartLine}
                      editBusySku={editBusySku}
                    />
                  );
                })}
              </ul>

              <CartSummary
                catalog={catalog}
                basketTotals={basketTotals}
                taxRateLabel={taxRateLabel}
                shopCheckoutEnabled={shopCheckoutEnabled}
                submitting={submitting}
                submitError={submitError}
                onCheckoutClick={handleCheckoutClick}
              />
            </div>
          )}
        </div>
      </CatalogAppShell>
    </>
  );
}
