"use client";

import Link from "next/link";
import type { InquirySuccessSummary } from "@/lib/order-inquiry-types";

type Props = {
  summary: InquirySuccessSummary;
  catalogSlug?: string;
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-8 w-8"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function formatQuantity(quantity: number, unitName?: string): string {
  const unit = unitName?.trim() || "Stück";
  return `${quantity} ${unit}`;
}

function joinNonEmpty(parts: Array<string | undefined>, sep: string): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join(sep);
}

export function InquirySuccessCard({ summary, catalogSlug }: Props) {
  const scanHref = catalogSlug ? `/c/${catalogSlug}/scan` : "/";
  const homeHref = catalogSlug ? `/c/${catalogSlug}` : "/";

  const inquiryFrom = joinNonEmpty(
    [summary.customerName, summary.facility, summary.postalCode],
    " · "
  );

  const hasMultipleItems = summary.items.length > 1;

  return (
    <div className="inquiry-success-card">
      <div className="inquiry-success-icon-wrap" aria-hidden>
        <CheckIcon />
      </div>

      <h1 className="inquiry-success-title">Anfrage ist raus</h1>
      <p className="inquiry-success-intro">
        Wir haben deine Anfrage erhalten und melden uns per E-Mail an{" "}
        <strong>{summary.email}</strong> mit einem individuellen Angebot.
      </p>

      <div className="inquiry-success-badge">
        Anfragenummer {summary.inquiryNumber}
      </div>

      <dl className="inquiry-success-table">
        {summary.items.map((item, index) => {
          const artikelLabel = hasMultipleItems
            ? `Artikel ${index + 1}`
            : "Artikel";
          return (
            <div key={`${item.name}-${index}`} className="inquiry-success-item">
              <div className="inquiry-success-row">
                <dt className="inquiry-success-row-label">{artikelLabel}</dt>
                <dd className="inquiry-success-row-value">{item.name}</dd>
              </div>
              {item.configuration ? (
                <div className="inquiry-success-row">
                  <dt className="inquiry-success-row-label">Konfiguration</dt>
                  <dd className="inquiry-success-row-value">
                    {item.configuration}
                  </dd>
                </div>
              ) : null}
              <div className="inquiry-success-row">
                <dt className="inquiry-success-row-label">Menge</dt>
                <dd className="inquiry-success-row-value">
                  {formatQuantity(item.quantity, item.unitName)}
                </dd>
              </div>
            </div>
          );
        })}

        {inquiryFrom ? (
          <div className="inquiry-success-row">
            <dt className="inquiry-success-row-label">Anfrage von</dt>
            <dd className="inquiry-success-row-value">{inquiryFrom}</dd>
          </div>
        ) : null}

        <div className="inquiry-success-row">
          <dt className="inquiry-success-row-label">Notiz</dt>
          <dd className="inquiry-success-row-value inquiry-success-row-value--muted">
            {summary.message?.trim() || "—"}
          </dd>
        </div>
      </dl>

      <div className="inquiry-success-actions">
        <Link href={scanHref} className="inquiry-success-btn inquiry-success-btn--ghost">
          Weiteren Artikel scannen
        </Link>
        <Link href={homeHref} className="inquiry-success-btn inquiry-success-btn--primary">
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
