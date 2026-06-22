"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  INQUIRY_COUNTRIES,
  INQUIRY_SALUTATIONS,
  INQUIRY_TITLES,
  type InquirySalutation,
} from "@/lib/inquiry-form-constants";
import type { Product } from "@/lib/mock-data";
import { formatVariantWithUnit } from "@/lib/product-format";
import { calcBasketTotals, calcLineTotals, formatEur } from "@/lib/pricing";

export type InquiryLine = {
  sku: string;
  quantity: number;
  product?: Product;
};

type Props = {
  catalogSlug: string;
  lines: InquiryLine[];
  onClose: () => void;
  onSuccess: () => void;
};

type FormState = {
  facility: string;
  position: string;
  salutation: InquirySalutation | "";
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  message: string;
  website: string;
};

const EMPTY_FORM: FormState = {
  facility: "",
  position: "",
  salutation: "",
  title: "",
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  country: "",
  phone: "",
  message: "",
  website: "",
};

const INQUIRY_SUBMIT_NOTE =
  "Nach dem Absenden wird Ihre Anfrage per E-Mail an unser Service-Team übermittelt. Wir speichern keine Daten in dieser Anwendung — die Angaben werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet.";

const IMPRESSUM_URL =
  process.env.NEXT_PUBLIC_COMPANY_IMPRESSUM_URL?.trim() ||
  "https://www.merzljak.de/impressum";

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function RequiredMark() {
  return (
    <span className="text-danger" aria-hidden>
      {" "}
      *
    </span>
  );
}

function FormField({
  label,
  htmlFor,
  children,
  required = false,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`inquiry-modal-field ${className}`.trim()}>
      <label htmlFor={htmlFor} className="inquiry-modal-field-label">
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
    </div>
  );
}

export function OrderInquiryModal({
  catalogSlug,
  lines,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, submitting]);

  const basketTotals = useMemo(() => {
    const priced = lines
      .map((line) => {
        if (!line.product) return null;
        return {
          quantity: line.quantity,
          unitPriceExclTax: line.product.unitPriceExclTax,
          taxRate: line.product.taxRate,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return calcBasketTotals(priced);
  }, [lines]);

  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setError(null);
    },
    []
  );

  const submit = useCallback(async () => {
    if (!form.salutation) {
      setError("Bitte wählen Sie eine Anrede.");
      return;
    }

    if (!agreedToTerms) {
      setError("Bitte bestätigen Sie die Datenschutzhinweise.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/order-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog: catalogSlug,
          customer: {
            facility: form.facility,
            position: form.position || undefined,
            salutation: form.salutation,
            title: form.title || undefined,
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            street: form.street,
            houseNumber: form.houseNumber,
            postalCode: form.postalCode,
            city: form.city,
            country: form.country,
            phone: form.phone,
            message: form.message || undefined,
          },
          lines: lines.map((line) => ({
            sku: line.sku,
            quantity: line.quantity,
          })),
          website: form.website,
        }),
      });

      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Anfrage konnte nicht gesendet werden.");
        return;
      }

      onSuccess();
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setSubmitting(false);
    }
  }, [agreedToTerms, catalogSlug, form, lines, onSuccess]);

  return (
    <div
      className="inquiry-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-inquiry-title"
      onMouseDown={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="inquiry-modal-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="inquiry-modal-header">
          <div className="min-w-0">
            <p className="inquiry-modal-label">Anfrage</p>
            <h2 id="order-inquiry-title" className="inquiry-modal-title">
              Anfrage per E-Mail senden
            </h2>
            <p className="inquiry-modal-intro">
              Füllen Sie das Formular aus — Ihre Artikelauswahl wird an unser
              Service-Team übermittelt.
            </p>
          </div>
          <button
            type="button"
            className="inquiry-modal-close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Schließen"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="inquiry-modal-body">
          <section aria-label="Ausgewählte Artikel">
            <h3 className="inquiry-modal-section-title">Ihre Artikel</h3>
            <div className="inquiry-modal-articles">
              <ul className="space-y-0">
                {lines.map((line) => {
                  const product = line.product;
                  const totals = product
                    ? calcLineTotals(
                        line.quantity,
                        product.unitPriceExclTax,
                        product.taxRate
                      )
                    : null;
                  const spec = product ? formatVariantWithUnit(product) : null;

                  return (
                    <li key={line.sku} className="inquiry-modal-article-row">
                      <div className="min-w-0">
                        <p className="inquiry-modal-article-name">
                          {product?.name ?? `Artikel ${line.sku}`}
                        </p>
                        {spec ? (
                          <p className="inquiry-modal-article-meta">{spec}</p>
                        ) : null}
                        <p className="inquiry-modal-article-meta">
                          Art. Nr. {product?.sku ?? line.sku} · Menge{" "}
                          {line.quantity}
                        </p>
                      </div>
                      {totals ? (
                        <span className="inquiry-modal-article-total">
                          {formatEur(totals.totalInclTax)}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {lines.some((line) => line.product) ? (
                <div className="inquiry-modal-articles-total">
                  <span>Gesamtbetrag</span>
                  <span>{formatEur(basketTotals.totalInclTax)}</span>
                </div>
              ) : null}
            </div>
          </section>

          <form
            id="order-inquiry-form"
            className="inquiry-modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <div className="absolute -left-[9999px]" aria-hidden>
              <label htmlFor="inquiry-website">Website</label>
              <input
                id="inquiry-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
              />
            </div>

            <FormField
              label="Praxis / Einrichtung / Firma"
              htmlFor="inquiry-facility"
              required
            >
              <input
                id="inquiry-facility"
                type="text"
                required
                autoComplete="organization"
                className="input-field"
                value={form.facility}
                onChange={(event) => updateField("facility", event.target.value)}
              />
            </FormField>

            <FormField label="Position" htmlFor="inquiry-position">
              <input
                id="inquiry-position"
                type="text"
                autoComplete="organization-title"
                className="input-field"
                value={form.position}
                onChange={(event) => updateField("position", event.target.value)}
              />
            </FormField>

            <div className="inquiry-modal-salutation-row">
              <span className="inquiry-modal-field-label shrink-0">
                Anrede
                <RequiredMark />
              </span>
              <div className="inquiry-modal-salutation-controls">
                {INQUIRY_SALUTATIONS.map((option) => (
                  <label key={option.value} className="inquiry-modal-radio">
                    <input
                      type="radio"
                      name="inquiry-salutation"
                      value={option.value}
                      checked={form.salutation === option.value}
                      onChange={() => updateField("salutation", option.value)}
                    />
                    {option.label}
                  </label>
                ))}
                <select
                  aria-label="Titel"
                  className="select-field inquiry-modal-title-select"
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                >
                  {INQUIRY_TITLES.map((option) => (
                    <option key={option.value || "none"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <FormField
              label="Vorname"
              htmlFor="inquiry-first-name"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-first-name"
                type="text"
                required
                autoComplete="given-name"
                className="input-field"
                value={form.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
              />
            </FormField>

            <FormField
              label="Nachname"
              htmlFor="inquiry-last-name"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-last-name"
                type="text"
                required
                autoComplete="family-name"
                className="input-field"
                value={form.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
              />
            </FormField>

            <FormField label="E-Mail" htmlFor="inquiry-email" required>
              <input
                id="inquiry-email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </FormField>

            <FormField
              label="Straße"
              htmlFor="inquiry-street"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-street"
                type="text"
                required
                autoComplete="street-address"
                className="input-field"
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
              />
            </FormField>

            <FormField
              label="Hausnummer"
              htmlFor="inquiry-house-number"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-house-number"
                type="text"
                required
                autoComplete="off"
                className="input-field"
                value={form.houseNumber}
                onChange={(event) =>
                  updateField("houseNumber", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="PLZ"
              htmlFor="inquiry-postal"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-postal"
                type="text"
                required
                autoComplete="postal-code"
                className="input-field"
                value={form.postalCode}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
              />
            </FormField>

            <FormField
              label="Ort"
              htmlFor="inquiry-city"
              required
              className="inquiry-modal-field-half"
            >
              <input
                id="inquiry-city"
                type="text"
                required
                autoComplete="address-level2"
                className="input-field"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />
            </FormField>

            <FormField label="Land" htmlFor="inquiry-country" required>
              <select
                id="inquiry-country"
                required
                className="select-field"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
              >
                {INQUIRY_COUNTRIES.map((option) => (
                  <option key={option.value || "empty"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Telefon" htmlFor="inquiry-phone" required>
              <input
                id="inquiry-phone"
                type="tel"
                required
                autoComplete="tel"
                className="input-field"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </FormField>

            <FormField label="Nachricht" htmlFor="inquiry-message">
              <textarea
                id="inquiry-message"
                rows={3}
                className="input-field resize-y"
                placeholder="Optional — z. B. Wunschtermin oder Rückfragen"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </FormField>

            <p className="inquiry-modal-note">{INQUIRY_SUBMIT_NOTE}</p>

            <label className="inquiry-modal-consent">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(event) => {
                  setAgreedToTerms(event.target.checked);
                  if (error) setError(null);
                }}
              />
              <span>
                Ich habe die{" "}
                <a
                  href={IMPRESSUM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Datenschutzhinweise
                </a>{" "}
                gelesen und stimme der Übermittlung meiner Angaben per E-Mail an
                das Service-Team zu.
              </span>
            </label>

            {error ? <p className="geo-warn col-span-2">{error}</p> : null}

            <div className="inquiry-modal-actions">
              <button
                type="button"
                className="cart-btn-outline"
                disabled={submitting}
                onClick={onClose}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="cart-btn-primary"
                disabled={submitting || !agreedToTerms}
              >
                {submitting ? "Wird gesendet…" : "Anfrage absenden"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
