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

function FormRow({
  label,
  htmlFor,
  children,
  required = false,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="inquiry-form-row">
      <label
        htmlFor={htmlFor}
        className="inquiry-form-label"
      >
        {label}
        {required ? " *" : ""}
      </label>
      <div className="min-w-0">{children}</div>
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
  }, [catalogSlug, form, lines, onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-secondary/55 p-0 backdrop-blur-sm md:items-center md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-inquiry-title"
      onMouseDown={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] border border-white/70 bg-white shadow-[0_-20px_60px_rgba(10,22,40,0.24)] md:mx-auto md:max-w-3xl md:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="border-b border-mercury px-5 py-5 md:px-7">
          <h2
            id="order-inquiry-title"
            className="text-lg font-semibold text-secondary md:text-xl"
          >
            Anfrage senden
          </h2>
          <p className="mt-1 text-sm text-quinary">
            Bitte füllen Sie das Formular aus — Ihre Artikelauswahl wird an den
            Anbieter weitergeleitet.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-7">
          <section aria-label="Ausgewählte Artikel">
            <h3 className="mb-2 text-sm font-semibold text-secondary">Artikel</h3>
            <ul className="space-y-2 rounded-lg border border-mercury bg-porcelain p-3 text-sm">
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
                  <li
                    key={line.sku}
                    className="flex items-start justify-between gap-3 border-b border-mercury/60 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-secondary">
                        {product?.name ?? `Artikel ${line.sku}`}
                      </p>
                      {spec ? (
                        <p className="text-xs font-medium text-secondary">{spec}</p>
                      ) : null}
                      <p className="text-xs text-quinary">
                        Art. {product?.sku ?? line.sku} · Menge {line.quantity}
                      </p>
                    </div>
                    {totals ? (
                      <span className="shrink-0 text-sm font-medium text-secondary">
                        {formatEur(totals.totalInclTax)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {lines.some((line) => line.product) ? (
              <p className="mt-2 text-right text-sm font-semibold text-secondary">
                Gesamt: {formatEur(basketTotals.totalInclTax)}
              </p>
            ) : null}
          </section>

          <form
            className="inquiry-form space-y-1"
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

            <FormRow label="Praxis / Einrichtung / Firma" htmlFor="inquiry-facility" required>
              <input
                id="inquiry-facility"
                type="text"
                required
                autoComplete="organization"
                className="input-field"
                value={form.facility}
                onChange={(event) => updateField("facility", event.target.value)}
              />
            </FormRow>

            <FormRow label="Position" htmlFor="inquiry-position">
              <input
                id="inquiry-position"
                type="text"
                autoComplete="organization-title"
                className="input-field"
                value={form.position}
                onChange={(event) => updateField("position", event.target.value)}
              />
            </FormRow>

            <FormRow label="Anrede" required>
              <div className="flex flex-wrap items-center gap-4">
                {INQUIRY_SALUTATIONS.map((option) => (
                  <label
                    key={option.value}
                    className="inline-flex cursor-pointer items-center gap-2 text-sm text-secondary"
                  >
                    <input
                      type="radio"
                      name="inquiry-salutation"
                      value={option.value}
                      checked={form.salutation === option.value}
                      onChange={() => updateField("salutation", option.value)}
                      className="h-4 w-4 accent-accent-pink"
                    />
                    {option.label}
                  </label>
                ))}
                <select
                  aria-label="Titel"
                  className="select-field max-w-[11rem]"
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
            </FormRow>

            <FormRow label="Vorname Nachname" required>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  id="inquiry-first-name"
                  type="text"
                  required
                  autoComplete="given-name"
                  placeholder="Vorname"
                  className="input-field"
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                />
                <input
                  id="inquiry-last-name"
                  type="text"
                  required
                  autoComplete="family-name"
                  placeholder="Nachname"
                  className="input-field"
                  value={form.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                />
              </div>
            </FormRow>

            <FormRow label="E-Mail" htmlFor="inquiry-email" required>
              <input
                id="inquiry-email"
                type="email"
                required
                autoComplete="email"
                className="input-field"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </FormRow>

            <FormRow label="Straße, Hausnummer" required>
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                <input
                  id="inquiry-street"
                  type="text"
                  required
                  autoComplete="street-address"
                  placeholder="Straße"
                  className="input-field"
                  value={form.street}
                  onChange={(event) => updateField("street", event.target.value)}
                />
                <input
                  id="inquiry-house-number"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Nr."
                  className="input-field"
                  value={form.houseNumber}
                  onChange={(event) =>
                    updateField("houseNumber", event.target.value)
                  }
                />
              </div>
            </FormRow>

            <FormRow label="PLZ, Ort" required>
              <div className="grid gap-3 sm:grid-cols-[7rem_1fr]">
                <input
                  id="inquiry-postal"
                  type="text"
                  required
                  autoComplete="postal-code"
                  placeholder="PLZ"
                  className="input-field"
                  value={form.postalCode}
                  onChange={(event) =>
                    updateField("postalCode", event.target.value)
                  }
                />
                <input
                  id="inquiry-city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  placeholder="Ort"
                  className="input-field"
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </div>
            </FormRow>

            <FormRow label="Land" htmlFor="inquiry-country" required>
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
            </FormRow>

            <FormRow label="Telefon" htmlFor="inquiry-phone" required>
              <input
                id="inquiry-phone"
                type="tel"
                required
                autoComplete="tel"
                className="input-field"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </FormRow>

            <FormRow label="Nachricht" htmlFor="inquiry-message">
              <textarea
                id="inquiry-message"
                rows={4}
                className="input-field resize-y"
                value={form.message}
                onChange={(event) => updateField("message", event.target.value)}
              />
            </FormRow>

            {error ? <p className="geo-warn !mt-4">{error}</p> : null}

            <div className="flex flex-col gap-2 pt-4 sm:flex-row">
              <button
                type="button"
                className="btn-secondary"
                disabled={submitting}
                onClick={onClose}
              >
                Abbrechen
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Wird gesendet…" : "Anfrage absenden"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
