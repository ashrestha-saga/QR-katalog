"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import type { Product } from "@/lib/mock-data";
import type {
  InquirySuccessSummary,
  OrderInquiryMeta,
} from "@/lib/order-inquiry-types";
import { formatVariantWithUnit } from "@/lib/product-format";
import { type LineTotals, formatEur } from "@/lib/pricing";
import { ProductThumb } from "./ProductThumb";

const PRIVACY_URL =
  process.env.NEXT_PUBLIC_COMPANY_PRIVACY_URL?.trim() ||
  process.env.NEXT_PUBLIC_COMPANY_IMPRESSUM_URL?.trim() ||
  "https://www.merzljak.de/impressum";

type FormState = {
  firstName: string;
  lastName: string;
  facility: string;
  postalCode: string;
  email: string;
  message: string;
  privacyAccepted: boolean;
  website: string;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  facility: "",
  postalCode: "",
  email: "",
  message: "",
  privacyAccepted: false,
  website: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^\d{4,10}$/;

type FieldErrors = Partial<Record<keyof FormState, string>>;

type Props = {
  catalogSlug: string;
  parentProduct: Product;
  displayProduct: Product;
  quantity: number;
  lineTotals: LineTotals;
  onQuantityChange: (quantity: number) => void;
  onBack: () => void;
  onSuccess: (summary: InquirySuccessSummary) => void;
};

function QrBadgeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7V5.5A1.5 1.5 0 0 1 5.5 4H7M17 4h1.5A1.5 1.5 0 0 1 20 5.5V7M20 17v1.5a1.5 1.5 0 0 1-1.5 1.5H17M7 20H5.5A1.5 1.5 0 0 1 4 18.5V17M7.5 8v8M11 8v8M14 8v8M16.5 8v8" />
    </svg>
  );
}

function buildVariantDimensions(
  parentProduct: Product,
  displayProduct: Product
): Array<{ label: string; value: string }> {
  const labels = (parentProduct.oxvarname || "").split("|").map((s) => s.trim());
  const values = (displayProduct.variant || "").split(",").map((s) => s.trim());
  const rows: Array<{ label: string; value: string }> = [];
  const length = Math.max(labels.length, values.length);
  for (let i = 0; i < length; i++) {
    const label = labels[i] || `Variante ${i + 1}`;
    const value = values[i];
    if (value) rows.push({ label, value });
  }
  return rows;
}

function formatConfiguration(
  parentProduct: Product,
  displayProduct: Product
): string {
  const dims = buildVariantDimensions(parentProduct, displayProduct);
  if (dims.length > 0) return dims.map((d) => d.value).join(", ");
  return displayProduct.variant || displayProduct.unitName || "Standardausführung";
}

function formatCapturedAt(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function InquiryRequestStep({
  catalogSlug,
  parentProduct,
  displayProduct,
  quantity,
  lineTotals,
  onQuantityChange,
  onBack,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  const capturedAtDate = useMemo(() => new Date(), []);
  const capturedAtLabel = useMemo(
    () => formatCapturedAt(capturedAtDate),
    [capturedAtDate]
  );

  const variantDimensions = useMemo(
    () => buildVariantDimensions(parentProduct, displayProduct),
    [parentProduct, displayProduct]
  );

  const disclosureRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [
      { label: "Artikelnummer", value: displayProduct.sku },
      { label: "Bezeichnung", value: parentProduct.name },
    ];
    for (const dim of variantDimensions) rows.push(dim);
    rows.push({ label: "Menge", value: String(quantity) });
    rows.push({
      label: "Listenpreis netto",
      value: `${formatEur(lineTotals.subtotalExclTax)}`,
    });
    rows.push({ label: "Quelle", value: `QR-Scan · Katalog ${catalogSlug}` });
    rows.push({ label: "Erfasst am", value: capturedAtLabel });
    return rows;
  }, [
    displayProduct.sku,
    parentProduct.name,
    variantDimensions,
    quantity,
    lineTotals.subtotalExclTax,
    catalogSlug,
    capturedAtLabel,
  ]);

  const variantLine = formatVariantWithUnit(displayProduct);
  const configuration = formatConfiguration(parentProduct, displayProduct);
  const taxRateLabel = Math.round(lineTotals.taxRate * 100);

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      setSubmitError(null);
    },
    []
  );

  function validate(current: FormState): FieldErrors {
    const errors: FieldErrors = {};
    if (current.firstName.trim().length < 2) {
      errors.firstName = "Bitte trage deinen Vornamen ein.";
    }
    if (current.lastName.trim().length < 2) {
      errors.lastName = "Bitte trage deinen Nachnamen ein.";
    }
    if (current.facility.trim().length < 2) {
      errors.facility = "Bitte trage den Namen deiner Praxis oder Klinik ein.";
    }
    if (!POSTAL_RE.test(current.postalCode.trim())) {
      errors.postalCode = "Bitte trage eine gültige PLZ ein.";
    }
    if (!EMAIL_RE.test(current.email.trim())) {
      errors.email = "Bitte trage eine gültige E-Mail-Adresse ein.";
    }
    if (!current.privacyAccepted) {
      errors.privacyAccepted = "Bitte stimme der Verarbeitung deiner Daten zu.";
    }
    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    const meta: OrderInquiryMeta = {
      source: `QR-Scan · Katalog ${catalogSlug}`,
      capturedAt: capturedAtLabel,
      variantDimensions,
    };

    try {
      const res = await fetch("/api/order-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog: catalogSlug,
          formType: "catalog",
          customer: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            facility: form.facility.trim(),
            postalCode: form.postalCode.trim(),
            email: form.email.trim(),
            message: form.message.trim() || undefined,
          },
          lines: [{ sku: displayProduct.sku, quantity }],
          meta,
          website: form.website,
        }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        inquiryNumber?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? "Anfrage konnte nicht gesendet werden.");
        return;
      }
      const firstName = form.firstName.trim();
      const lastName = form.lastName.trim();
      const customerName = `${firstName} ${lastName}`.trim();
      const summary: InquirySuccessSummary = {
        inquiryNumber: data.inquiryNumber ?? "",
        email: form.email.trim(),
        customerName,
        facility: form.facility.trim(),
        postalCode: form.postalCode.trim() || undefined,
        message: form.message.trim() || undefined,
        items: [
          {
            name: parentProduct.name,
            configuration,
            quantity,
            unitName: displayProduct.unitName,
          },
        ],
      };
      onSuccess(summary);
    } catch {
      setSubmitError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="inquiry-request-page">
      <p className="article-page-label">Anfrage</p>
      <h1 className="article-page-title">Angebot anfordern</h1>
      <p className="article-page-description">
        Die Produktdaten aus deinem Scan sind bereits eingetragen. Es fehlen nur
        noch deine Kontaktdaten.
      </p>

      <div className="inquiry-request-layout">
        <aside className="inquiry-request-column">
          <div className="inquiry-request-panel">
            <div className="inquiry-request-panel-head">
              <span className="inquiry-request-scan-badge">
                <QrBadgeIcon />
                Per Scan erfasst
              </span>
              <h2 className="inquiry-request-summary-title">
                {parentProduct.name}
              </h2>
            </div>

            <div className="inquiry-request-panel-thumb">
              <ProductThumb
                product={displayProduct}
                className="inquiry-request-thumb"
              />
              <div className="inquiry-request-thumb-body">
                <p className="inquiry-request-artnr">
                  Artikel {displayProduct.sku}
                </p>
                {variantLine ? (
                  <p className="inquiry-request-variantline">{variantLine}</p>
                ) : null}
                <p className="inquiry-request-thumb-hint">
                  VE: {displayProduct.unitName || "Stück"} · Lieferzeit auf
                  Anfrage
                </p>
                <button
                  type="button"
                  className="inquiry-request-textlink"
                  onClick={onBack}
                >
                  Variante ändern
                </button>
              </div>
            </div>

            <div className="inquiry-request-panel-body">
              <div className="inquiry-request-table">
                <div className="inquiry-request-row">
                  <span className="inquiry-request-row-key">Konfiguration</span>
                  <span className="inquiry-request-row-val">
                    {configuration}
                  </span>
                </div>
                <div className="inquiry-request-row">
                  <span className="inquiry-request-row-key">Menge</span>
                  <span className="inquiry-request-row-val">
                    {quantity} Stück
                  </span>
                </div>
                <div className="inquiry-request-row">
                  <span className="inquiry-request-row-key">
                    Stückpreis (Liste)
                  </span>
                  <span className="inquiry-request-row-val">
                    {formatEur(displayProduct.unitPriceExclTax)}
                  </span>
                </div>
                <div className="inquiry-request-row inquiry-request-row--price">
                  <span className="inquiry-request-row-key">Anfragewert</span>
                  <span className="inquiry-request-row-val">
                    <span className="inquiry-request-price">
                      {formatEur(lineTotals.subtotalExclTax)}
                    </span>
                    <span className="inquiry-request-vat">
                      zzgl. {taxRateLabel} % MwSt.
                    </span>
                  </span>
                </div>
              </div>

              <div
                className="inquiry-request-qtyrow"
                role="group"
                aria-labelledby="inquiry-qty-label"
              >
                <span
                  id="inquiry-qty-label"
                  className="inquiry-request-qty-label"
                >
                  Menge
                </span>
                <div className="inquiry-request-stepper">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() =>
                      onQuantityChange(Math.max(1, quantity - 1))
                    }
                    aria-label="Menge verringern"
                  >
                    −
                  </button>
                  <output aria-live="polite">{quantity}</output>
                  <button
                    type="button"
                    disabled={quantity >= 99}
                    onClick={() =>
                      onQuantityChange(Math.min(99, quantity + 1))
                    }
                    aria-label="Menge erhöhen"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          <details
            className="inquiry-request-payload"
            open={showDisclosure}
            onToggle={(event) =>
              setShowDisclosure((event.target as HTMLDetailsElement).open)
            }
          >
            <summary>
              <span>Diese Daten senden wir mit</span>
              <span aria-hidden>{showDisclosure ? "Ausblenden" : "Anzeigen"}</span>
            </summary>
            <div className="inquiry-request-payload-body">
              <dl>
                {disclosureRows.map((row) => (
                  <div key={row.label} className="inquiry-request-payload-row">
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        </aside>

        <form
          className="inquiry-request-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="inquiry-request-grid2">
            <div className="inquiry-request-field">
              <label
                htmlFor="inquiry-first-name"
                className="inquiry-request-field-label"
              >
                Vorname <span className="inquiry-request-req">*</span>
              </label>
              <input
                id="inquiry-first-name"
                className="inquiry-request-input"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                autoComplete="given-name"
                aria-invalid={fieldErrors.firstName ? "true" : undefined}
                aria-describedby={
                  fieldErrors.firstName ? "err-first-name" : undefined
                }
              />
              {fieldErrors.firstName ? (
                <p id="err-first-name" className="inquiry-request-error-msg">
                  {fieldErrors.firstName}
                </p>
              ) : null}
            </div>

            <div className="inquiry-request-field">
              <label
                htmlFor="inquiry-last-name"
                className="inquiry-request-field-label"
              >
                Nachname <span className="inquiry-request-req">*</span>
              </label>
              <input
                id="inquiry-last-name"
                className="inquiry-request-input"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                autoComplete="family-name"
                aria-invalid={fieldErrors.lastName ? "true" : undefined}
                aria-describedby={
                  fieldErrors.lastName ? "err-last-name" : undefined
                }
              />
              {fieldErrors.lastName ? (
                <p id="err-last-name" className="inquiry-request-error-msg">
                  {fieldErrors.lastName}
                </p>
              ) : null}
            </div>
          </div>

          <div className="inquiry-request-field">
            <label
              htmlFor="inquiry-facility"
              className="inquiry-request-field-label"
            >
              Praxis- oder Klinikname{" "}
              <span className="inquiry-request-req">*</span>
            </label>
            <input
              id="inquiry-facility"
              className="inquiry-request-input"
              value={form.facility}
              onChange={(event) => updateField("facility", event.target.value)}
              autoComplete="organization"
              aria-invalid={fieldErrors.facility ? "true" : undefined}
              aria-describedby={
                fieldErrors.facility ? "err-facility" : undefined
              }
            />
            {fieldErrors.facility ? (
              <p id="err-facility" className="inquiry-request-error-msg">
                {fieldErrors.facility}
              </p>
            ) : null}
          </div>

          <div className="inquiry-request-grid2">
            <div className="inquiry-request-field">
              <label
                htmlFor="inquiry-postal"
                className="inquiry-request-field-label"
              >
                PLZ <span className="inquiry-request-req">*</span>
              </label>
              <input
                id="inquiry-postal"
                className="inquiry-request-input"
                value={form.postalCode}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
                inputMode="numeric"
                maxLength={10}
                autoComplete="postal-code"
                aria-invalid={fieldErrors.postalCode ? "true" : undefined}
                aria-describedby={
                  fieldErrors.postalCode
                    ? "err-postal hint-postal"
                    : "hint-postal"
                }
              />
              {fieldErrors.postalCode ? (
                <p id="err-postal" className="inquiry-request-error-msg">
                  {fieldErrors.postalCode}
                </p>
              ) : null}
              <p id="hint-postal" className="inquiry-request-hint">
                Für Liefergebiet und zuständigen Ansprechpartner.
              </p>
            </div>

            <div className="inquiry-request-field">
              <label
                htmlFor="inquiry-email"
                className="inquiry-request-field-label"
              >
                E-Mail <span className="inquiry-request-req">*</span>
              </label>
              <input
                id="inquiry-email"
                type="email"
                className="inquiry-request-input"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                autoComplete="email"
                placeholder="praxis@musterpraxis.de"
                aria-invalid={fieldErrors.email ? "true" : undefined}
                aria-describedby={
                  fieldErrors.email ? "err-email hint-email" : "hint-email"
                }
              />
              {fieldErrors.email ? (
                <p id="err-email" className="inquiry-request-error-msg">
                  {fieldErrors.email}
                </p>
              ) : null}
              <p id="hint-email" className="inquiry-request-hint">
                Aus deinem Konto übernommen — änderbar.
              </p>
            </div>
          </div>

          <div className="inquiry-request-field">
            <label
              htmlFor="inquiry-message"
              className="inquiry-request-field-label"
            >
              Notiz zur Anfrage
            </label>
            <textarea
              id="inquiry-message"
              className="inquiry-request-input inquiry-request-textarea"
              rows={4}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="z. B. Wunschtermin, abweichende Polsterfarbe, Aufstellung im Behandlungsraum 2 …"
            />
            <p className="inquiry-request-hint">
              Optional. Alles, was wir für dein Angebot wissen sollten.
            </p>
          </div>

          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(event) => updateField("website", event.target.value)}
            className="inquiry-request-honeypot"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          <label className="inquiry-request-check">
            <input
              type="checkbox"
              checked={form.privacyAccepted}
              onChange={(event) =>
                updateField("privacyAccepted", event.target.checked)
              }
            />
            <span>
              Ich bin damit einverstanden, dass meine Angaben zur Bearbeitung
              der Anfrage gespeichert und verarbeitet werden.{" "}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inquiry-request-textlink"
              >
                Datenschutzhinweise
              </a>{" "}
              <span className="inquiry-request-req">*</span>
            </span>
          </label>
          {fieldErrors.privacyAccepted ? (
            <p className="inquiry-request-error-msg inquiry-request-error-msg--check">
              {fieldErrors.privacyAccepted}
            </p>
          ) : null}

          {submitError ? (
            <p
              className="inquiry-request-submit-error"
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          <div className="inquiry-request-actions">
            <button
              type="button"
              className="inquiry-request-btn inquiry-request-btn--ghost"
              onClick={onBack}
              disabled={submitting}
            >
              Zurück zur Variante
            </button>
            <button
              type="submit"
              className="inquiry-request-btn inquiry-request-btn--primary"
              disabled={submitting}
            >
              {submitting ? "Wird gesendet …" : "Anfrage senden →"}
            </button>
          </div>

          <p className="inquiry-request-footnote">
            Antwort in der Regel innerhalb eines Werktags.
          </p>
        </form>
      </div>
    </div>
  );
}
