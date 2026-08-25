"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MOCK_HAENDLER,
  type Product,
  buildProductForwardUrl,
  buildTargetUrl,
  getHaendler,
} from "@/lib/mock-data";
import {
  calcLineTotals,
  formatEur,
  formatTaxRate,
} from "@/lib/pricing";
import { setHaendlerCookie } from "@/lib/cookies";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { isShopCheckoutEnabled } from "@/lib/order-mode";
import { useGeo } from "@/hooks/useGeo";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import {
  setCartAddedToast,
  type ArticleConfiguration,
} from "@/lib/wishlist-session";
import {
  WIZARD_ACTIVE_STEPS,
  WIZARD_DEALER_STEP,
  WIZARD_GEO_STEP_ENABLED,
  WIZARD_HAENDLER_STEP_ENABLED,
  WIZARD_ORDER_STEP,
  WIZARD_SUCCESS_STEP,
} from "@/lib/wizard-config";
import { ArticleOrderStep } from "./ArticleOrderStep";
import { AppShell } from "./AppShell";
import {
  GeoHaendlerStep,
  type GeoSelectionTab,
} from "./GeoHaendlerStep";
import { HaendlerSelectionStep } from "./HaendlerSelectionStep";
import { OrderInquiryModal } from "./OrderInquiryModal";
import { ProductDetailStep } from "./ProductDetailStep";
import { ProductSideSummary } from "./ProductSideSummary";
import { ProductThumb } from "./ProductThumb";
import { StepIndicator } from "./StepIndicator";

function stepDescription(step: number): string {
  if (step === 1) {
    return "Du hast einen QR-Code im Printkatalog gescannt. Hier sind die Produkt-Details.";
  }
  if (step === WIZARD_DEALER_STEP) {
    return WIZARD_GEO_STEP_ENABLED
      ? "Wähle deinen Händler. Die Region wurde automatisch erkannt, du kannst aber auch nach PLZ suchen."
      : "Wähle den Händler, bei dem du bestellen möchtest.";
  }
  if (step === WIZARD_ORDER_STEP) {
    return WIZARD_HAENDLER_STEP_ENABLED
      ? "Menge und Gesamtbetrag — Bestellung beim gewählten Händler."
      : "Menge und Gesamtbetrag — danach direkt zum Warenkorb.";
  }
  return "Deine Artikel werden zur Bestellung übergeben.";
}

type Props = {
  product: Product;
  initialHaendler?: string | null;
  onComplete?: (redirectUrl: string) => void;
  wishlistMode?: boolean;
  catalogSlug?: string;
  initialSelection?: Partial<ArticleConfiguration>;
  onSaveToCart?: (config: ArticleConfiguration) => void;
  useShell?: boolean;
};

export function RoutingWizard({
  product,
  initialHaendler,
  onComplete,
  wishlistMode = false,
  catalogSlug,
  initialSelection,
  onSaveToCart,
  useShell = true,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [quantity, setQuantity] = useState(initialSelection?.quantity ?? 1);
  const [region, setRegion] = useState(initialSelection?.region ?? "");
  const [selectedHaendler, setSelectedHaendler] = useState(
    initialSelection?.haendlerId ??
      initialHaendler ??
      MOCK_HAENDLER[0].id
  );
  const [remember, setRemember] = useState(initialSelection?.remember ?? true);
  const [plz, setPlz] = useState("");
  const [selectionTab, setSelectionTab] = useState<GeoSelectionTab>("geo");
  const [plzSearched, setPlzSearched] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const shopCheckoutEnabled = isShopCheckoutEnabled();
  const resolvedCatalogSlug = catalogSlug?.trim() || DEFAULT_CATALOG_SLUG;

  const initialVariantArtnum =
    initialSelection?.product?.sku &&
    initialSelection.product.sku !== product.sku
      ? initialSelection.product.sku
      : undefined;

  const variantSelection = useVariantSelection(product, { initialVariantArtnum });
  const displayProduct = variantSelection.displayProduct;
  /** Variant oxartnum when configured, otherwise parent article SKU */
  const cartSku = displayProduct.sku;

  const { geo, loading: geoLoading, error: geoError, fetchGeo } = useGeo(false);

  const recommendedId = geo?.recommended_haendler ?? null;
  const selectedHaendlerEntity = WIZARD_HAENDLER_STEP_ENABLED
    ? getHaendler(selectedHaendler)
    : null;

  const lineTotals = calcLineTotals(
    quantity,
    displayProduct.unitPriceExclTax,
    displayProduct.taxRate
  );

  const forwardUrl = useCallback(() => {
    if (WIZARD_HAENDLER_STEP_ENABLED) {
      return buildTargetUrl(selectedHaendler, displayProduct.sku, quantity);
    }
    return buildProductForwardUrl(displayProduct.sku, quantity, catalogSlug);
  }, [selectedHaendler, displayProduct.sku, quantity, catalogSlug]);

  useEffect(() => {
    if (!WIZARD_HAENDLER_STEP_ENABLED || !WIZARD_GEO_STEP_ENABLED) return;
    if (step !== WIZARD_DEALER_STEP) return;
    fetchGeo();
  }, [step, fetchGeo]);

  useEffect(() => {
    if (!WIZARD_HAENDLER_STEP_ENABLED || !WIZARD_GEO_STEP_ENABLED || !geo) return;
    if (geo.region) setRegion(geo.region);
    if (geo.recommended_haendler) {
      setSelectedHaendler(geo.recommended_haendler);
    }
  }, [geo]);

  const searchPlz = useCallback(() => {
    const trimmed = plz.trim();
    if (trimmed.length < 2) return;
    setPlzSearched(true);
    void fetchGeo({ plz: trimmed });
  }, [plz, fetchGeo]);

  const goToOrderStep = useCallback(() => {
    setStep(WIZARD_ORDER_STEP);
  }, []);

  const goBackFromOrder = useCallback(() => {
    setStep(WIZARD_DEALER_STEP ?? 1);
  }, []);

  useEffect(() => {
    if (!shopCheckoutEnabled) {
      setIsRedirecting(false);
      return;
    }
    if (step !== WIZARD_SUCCESS_STEP || wishlistMode) {
      setIsRedirecting(false);
      return;
    }
    setIsRedirecting(true);
    const url = forwardUrl();
    const timer = window.setTimeout(() => {
      window.location.assign(url);
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [step, wishlistMode, forwardUrl, shopCheckoutEnabled]);

  const finish = useCallback(() => {
    if (wishlistMode && onSaveToCart) {
      const config: ArticleConfiguration = {
        sku: cartSku,
        quantity,
        product: displayProduct,
      };
      if (WIZARD_HAENDLER_STEP_ENABLED) {
        if (remember) setHaendlerCookie(selectedHaendler);
        config.haendlerId = selectedHaendler;
        config.region = region;
        config.remember = remember;
      }
      onSaveToCart(config);
      if (catalogSlug) {
        setCartAddedToast({
          catalogSlug,
          productName: displayProduct.name,
          quantity,
        });
        router.push(`/c/${catalogSlug}/cart`);
        return;
      }
      setStep(WIZARD_SUCCESS_STEP);
      return;
    }

    if (!shopCheckoutEnabled) {
      setShowInquiryModal(true);
      return;
    }

    const url = forwardUrl();

    if (WIZARD_HAENDLER_STEP_ENABLED && remember) {
      setHaendlerCookie(selectedHaendler);
    }
    onComplete?.(url);
    setStep(WIZARD_SUCCESS_STEP);
  }, [
    forwardUrl,
    wishlistMode,
    onSaveToCart,
    cartSku,
    displayProduct,
    quantity,
    remember,
    selectedHaendler,
    region,
    onComplete,
    shopCheckoutEnabled,
    catalogSlug,
    router,
  ]);

  const handleInquirySuccess = useCallback(() => {
    setShowInquiryModal(false);
    setInquirySubmitted(true);
    setStep(WIZARD_SUCCESS_STEP);
  }, []);

  if (step === WIZARD_SUCCESS_STEP) {
    const url = shopCheckoutEnabled ? forwardUrl() : "#";

    const successBody =
      wishlistMode && catalogSlug ? (
        <div className="stage-card">
          <StepIndicator current={WIZARD_SUCCESS_STEP} total={WIZARD_SUCCESS_STEP} />
          <p className="step-description">{stepDescription(WIZARD_SUCCESS_STEP)}</p>
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Artikel im Warenkorb
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              <strong>{displayProduct.name}</strong> · {quantity}×
              {WIZARD_HAENDLER_STEP_ENABLED && selectedHaendlerEntity ? (
                <>
                  {" "}
                  bei <strong>{selectedHaendlerEntity.name}</strong>
                </>
              ) : null}
            </p>
          </div>
          <div className="nav-buttons flex-col sm:flex-row">
            <Link href={`/c/${catalogSlug}/scan`} className="btn-primary">
              Weiteren Artikel scannen
            </Link>
            <Link href={`/c/${catalogSlug}/cart`} className="btn-secondary">
              Zum Warenkorb
            </Link>
          </div>
        </div>
      ) : inquirySubmitted ? (
        <div className="stage-card">
          <StepIndicator current={WIZARD_SUCCESS_STEP} total={WIZARD_SUCCESS_STEP} />
          <p className="step-description">Ihre Anfrage wurde übermittelt.</p>
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Anfrage gesendet
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              <strong>{displayProduct.name}</strong> · {quantity}×
            </p>
            <p className="mt-2 text-sm text-quinary">
              Der Anbieter wurde per E-Mail informiert und kann sich bei Ihnen
              melden.
            </p>
          </div>
          <div className="nav-buttons">
            {catalogSlug ? (
              <>
                <Link href={`/c/${catalogSlug}/scan`} className="btn-primary">
                  Weiteren Artikel scannen
                </Link>
                <Link href={`/c/${catalogSlug}`} className="btn-secondary">
                  Zur Startseite
                </Link>
              </>
            ) : (
              <Link href="/" className="btn-primary">
                Zur Startseite
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="stage-card">
          <StepIndicator current={WIZARD_SUCCESS_STEP} total={WIZARD_SUCCESS_STEP} />
          <p className="step-description">{stepDescription(WIZARD_SUCCESS_STEP)}</p>
          <div className="success-message">
            <div className="success-icon" aria-hidden>
              ✓
            </div>
            <h2 className="text-xl font-semibold text-accent-success-text">
              Weiterleitung zur Bestellung
            </h2>
            <p className="mt-2 text-sm text-accent-success-muted">
              {WIZARD_HAENDLER_STEP_ENABLED && selectedHaendlerEntity ? (
                <>
                  Warenkorb wurde an <strong>{selectedHaendlerEntity.name}</strong>{" "}
                  übergeben.
                </>
              ) : (
                <>Deine Artikel wurden zur Bestellung übergeben.</>
              )}
            </p>
          </div>
          <div className="verteilseite text-center">
            <p className="text-4xl text-quinary" aria-hidden>
              🛒
            </p>
            <p className="mt-3 text-base font-semibold text-secondary">Bereit zur Bestellung</p>
            <p className="mt-2 text-sm text-quinary">
              Du wirst jetzt direkt zum Shop weitergeleitet.
            </p>
          </div>
          {isRedirecting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-quinary">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-blue" />
              Weiterleitung in 3 Sekunden…
            </div>
          )}
          <div className="nav-buttons">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Zur Bestellung
            </a>
            <Link href="/" className="btn-secondary">
              Zur Startseite
            </Link>
          </div>
        </div>
      );

    if (!useShell) {
      return (
        <>
          {showInquiryModal ? (
            <OrderInquiryModal
              catalogSlug={resolvedCatalogSlug}
              lines={[{ sku: displayProduct.sku, quantity, product: displayProduct }]}
              onClose={() => setShowInquiryModal(false)}
              onSuccess={handleInquirySuccess}
            />
          ) : null}
          {successBody}
        </>
      );
    }
    return (
      <AppShell brandBadge="Fertig">
        {showInquiryModal ? (
          <OrderInquiryModal
            catalogSlug={resolvedCatalogSlug}
            lines={[{ sku: displayProduct.sku, quantity, product: displayProduct }]}
            onClose={() => setShowInquiryModal(false)}
            onSuccess={handleInquirySuccess}
          />
        ) : null}
        {successBody}
      </AppShell>
    );
  }

  const wizardShellClass =
    !useShell && wishlistMode ? "article-page" : "stage-card";

  const wizardBody = (
    <>
      <div className={wizardShellClass}>
        <StepIndicator
          current={step}
          total={WIZARD_ACTIVE_STEPS}
          variant={
            wishlistMode && (step === 1 || step === WIZARD_ORDER_STEP)
              ? "article"
              : "default"
          }
          mobileSubtitle={
            step === WIZARD_ORDER_STEP && selectedHaendlerEntity
              ? `Bei ${selectedHaendlerEntity.name}.`
              : undefined
          }
        />

        {!(wishlistMode && (step === 1 || step === WIZARD_ORDER_STEP)) ? (
          <p className="step-description">{stepDescription(step)}</p>
        ) : null}

        {step === 1 && (
          <>
            {wishlistMode ? (
              <>
                <p className="article-page-label">
                  Schritt 1 von {WIZARD_ACTIVE_STEPS} · Produkt
                </p>
                <h1 className="article-page-title">
                  {variantSelection.hasVariants
                    ? "Variante wählen"
                    : "Produkt prüfen"}
                </h1>
                <p className="article-page-description">
                  {variantSelection.hasVariants
                    ? `Du hast ${displayProduct.sku} gescannt. Wähle Optionen aus — Vorschau, Artikelnummer und Preis aktualisieren sich live.`
                    : `Du hast ${displayProduct.sku} gescannt. Prüfe die Produktdetails und wähle die gewünschte Menge.`}
                </p>
              </>
            ) : null}

            <ProductDetailStep
              product={displayProduct}
              variantSelection={variantSelection}
              balancedLayout={wishlistMode}
            >
              {wishlistMode ? (
                <div className="article-quantity-row">
                  <span className="article-variant-label">Menge</span>
                  <div className="cart-qty-control">
                    <button
                      type="button"
                      className="cart-qty-btn"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Menge verringern"
                    >
                      −
                    </button>
                    <span className="cart-qty-value">{quantity}</span>
                    <button
                      type="button"
                      className="cart-qty-btn"
                      disabled={quantity >= 99}
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                      aria-label="Menge erhöhen"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : null}

              <div
                className={
                  wishlistMode ? "article-step-actions" : "nav-buttons"
                }
              >
                {wishlistMode ? (
                  <Link
                    href={`/c/${resolvedCatalogSlug}/scan`}
                    className="cart-btn-outline"
                  >
                    Zurück
                  </Link>
                ) : null}
                <button
                  type="button"
                  className={wishlistMode ? "cart-btn-primary" : "btn-primary"}
                  disabled={!variantSelection.isVariantSelectionComplete}
                  onClick={() =>
                    setStep(WIZARD_DEALER_STEP ?? WIZARD_ORDER_STEP)
                  }
                >
                  Weiter zur Bestellung →
                </button>
              </div>
            </ProductDetailStep>
            {!variantSelection.isVariantSelectionComplete &&
            variantSelection.hasVariants ? (
              <p className="mt-3 text-center text-base text-quinary">
                Bitte wähle alle Varianten aus, um fortzufahren.
              </p>
            ) : null}
          </>
        )}

        {WIZARD_HAENDLER_STEP_ENABLED &&
          step === WIZARD_DEALER_STEP &&
          (WIZARD_GEO_STEP_ENABLED ? (
            <GeoHaendlerStep
              selectionTab={selectionTab}
              onSelectionTabChange={setSelectionTab}
              geo={geo}
              geoLoading={geoLoading}
              geoError={geoError}
              recommendedId={recommendedId}
              selectedHaendler={selectedHaendler}
              onSelectHaendler={setSelectedHaendler}
              plz={plz}
              onPlzChange={(value) => {
                setPlz(value);
                setPlzSearched(false);
              }}
              plzSearched={plzSearched}
              onSearchPlz={searchPlz}
              remember={remember}
              onRememberChange={setRemember}
              onBack={() => setStep(1)}
              onNext={goToOrderStep}
            />
          ) : (
            <HaendlerSelectionStep
              selectedHaendler={selectedHaendler}
              onSelectHaendler={setSelectedHaendler}
              remember={remember}
              onRememberChange={setRemember}
              onBack={() => setStep(1)}
              onNext={goToOrderStep}
            />
          ))}

        {step === WIZARD_ORDER_STEP && wishlistMode ? (
          <>
            <p className="article-page-label">
              Schritt {WIZARD_ORDER_STEP} von {WIZARD_ACTIVE_STEPS} · Bestellung
            </p>
            <h1 className="article-page-title">Menge & Gesamtbetrag</h1>
            <p className="article-page-description">
              Prüfe deine Auswahl und lege die Menge fest – danach gehst du
              direkt zum Warenkorb.
            </p>

            <ArticleOrderStep
              product={displayProduct}
              quantity={quantity}
              lineTotals={lineTotals}
              onQuantityChange={setQuantity}
              onBack={goBackFromOrder}
              onSave={finish}
            />
          </>
        ) : null}

        {step === WIZARD_ORDER_STEP && !wishlistMode ? (
          <div className="verteilseite">
            {WIZARD_HAENDLER_STEP_ENABLED && selectedHaendlerEntity && (
              <p className="mb-4 hidden text-sm text-quinary md:block">
                Bestellung bei <strong>{selectedHaendlerEntity.name}</strong>
              </p>
            )}

            <div className="product-card-mobile mb-4 md:hidden">
              <ProductSideSummary product={displayProduct} />
            </div>

            <div className="product-banner mb-4 hidden md:flex">
              <ProductSideSummary
                product={displayProduct}
                thumb={
                  <ProductThumb
                    product={displayProduct}
                    className="h-[60px] w-[60px] rounded-lg"
                  />
                }
                nameClassName="text-base font-semibold text-secondary"
              />
            </div>

            <div className="quantity-row-mobile md:hidden">
              <span className="text-sm font-medium text-secondary">Menge</span>
              <div className="quantity-control">
                <button
                  type="button"
                  className="quantity-btn"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Menge verringern"
                >
                  −
                </button>
                <span className="min-w-[2.25rem] text-center text-[15px] font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="quantity-btn"
                  disabled={quantity >= 99}
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="Menge erhöhen"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4 hidden flex-wrap items-center justify-between gap-4 md:flex">
              <div>
                <div className="product-label mb-1">Menge</div>
                <div className="quantity-control">
                  <button
                    type="button"
                    className="quantity-btn"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Menge verringern"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="quantity-btn"
                    disabled={quantity >= 99}
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label="Menge erhöhen"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="product-label mb-1">Verfügbar</div>
                <div className="flex items-center justify-end gap-1.5 text-[13px] font-medium text-accent-success-muted">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-accent-green"
                    aria-hidden
                  />
                  Auf Lager
                </div>
              </div>
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span className="text-quinary">Produktpreis ({quantity} ×)</span>
                <span className="font-medium">
                  {formatEur(lineTotals.subtotalExclTax)}
                </span>
              </div>
              <div className="summary-row">
                <span className="text-quinary">{formatTaxRate(lineTotals.taxRate)}</span>
                <span className="font-medium">{formatEur(lineTotals.taxAmount)}</span>
              </div>
              <div className="summary-total">
                <span>Gesamt</span>
                <span>{formatEur(lineTotals.totalInclTax)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-porcelain px-4 py-3 text-[13px] text-quinary">
              {wishlistMode ? (
                <>
                  ℹ️ Deine Auswahl wird im Warenkorb gespeichert. Du wirst danach
                  direkt zum Warenkorb weitergeleitet.
                </>
              ) : shopCheckoutEnabled ? (
                <>
                  ℹ️ Du wirst mit deinen Artikeln zur Bestellung weitergeleitet, um die
                  Bestellung abzuschließen.
                </>
              ) : (
                <>
                  ℹ️ Ohne Online-Shop sendest du eine Anfrage mit deinen
                  Kontaktdaten an den Anbieter.
                </>
              )}
            </div>

            <div className="nav-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={goBackFromOrder}
              >
                <span className="md:hidden">←</span>
                <span className="hidden md:inline">
                  {WIZARD_HAENDLER_STEP_ENABLED
                    ? "← Anderen Händler wählen"
                    : "← Zurück"}
                </span>
              </button>
              <button type="button" className="btn-primary md:flex-1" onClick={finish}>
                <span className="md:hidden">
                  {wishlistMode ? "Speichern →" : shopCheckoutEnabled ? "Bestellen →" : "Anfrage →"}
                </span>
                <span className="hidden md:inline">
                  {wishlistMode
                    ? "In Warenkorb speichern →"
                    : shopCheckoutEnabled
                      ? "Zur Bestellung →"
                      : "Anfrage senden →"}
                </span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {!wishlistMode && (
        <p className="app-footer">
          <Link href="/" className="underline hover:text-secondary">
            Weitere Artikel scannen
          </Link>
        </p>
      )}
    </>
  );

  if (!useShell) {
    return (
      <>
        {showInquiryModal ? (
          <OrderInquiryModal
            catalogSlug={resolvedCatalogSlug}
            lines={[{ sku: displayProduct.sku, quantity, product: displayProduct }]}
            onClose={() => setShowInquiryModal(false)}
            onSuccess={handleInquirySuccess}
          />
        ) : null}
        {wizardBody}
      </>
    );
  }

  return (
    <AppShell brandTitle="QR-Routing Erweitert" brandBadge="Mit Bestellung">
      {showInquiryModal ? (
        <OrderInquiryModal
          catalogSlug={resolvedCatalogSlug}
          lines={[{ sku: displayProduct.sku, quantity, product: displayProduct }]}
          onClose={() => setShowInquiryModal(false)}
          onSuccess={handleInquirySuccess}
        />
      ) : null}
      {wizardBody}
    </AppShell>
  );
}
