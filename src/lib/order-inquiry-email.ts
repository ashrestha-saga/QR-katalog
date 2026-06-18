import type { Catalog } from "@/lib/catalog";
import {
  formatInquirySalutation,
  getInquiryCountryLabel,
} from "@/lib/inquiry-form-constants";
import type { OrderInquiryCustomer, ResolvedInquiryLine } from "@/lib/order-inquiry-types";
import { formatVariantWithUnit } from "@/lib/product-format";
import { formatEur } from "@/lib/pricing";

export type OrderInquiryEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lineLabel(line: ResolvedInquiryLine): string {
  const spec = formatVariantWithUnit({
    variant: line.variant,
    unitName: line.unitName,
  });
  if (spec) return `${line.name} — ${spec}`;
  return line.name;
}

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCustomerName(customer: OrderInquiryCustomer): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

function buildCustomerRows(
  customer: OrderInquiryCustomer
): Array<[string, string]> {
  const countryLabel = getInquiryCountryLabel(customer.country);
  const address = `${customer.street} ${customer.houseNumber}, ${customer.postalCode} ${customer.city}, ${countryLabel}`;

  return [
    ["Anrede", formatInquirySalutation(customer.salutation, customer.title)],
    ["Name", formatCustomerName(customer)],
    ["Praxis / Einrichtung / Firma", customer.facility],
    customer.position ? ["Position", customer.position] : null,
    ["E-Mail", customer.email],
    ["Telefon", customer.phone],
    ["Adresse", address],
    customer.message ? ["Nachricht", customer.message] : null,
  ].filter((row): row is [string, string] => row !== null);
}

export function buildOrderInquiryEmail(params: {
  catalog: Catalog;
  customer: OrderInquiryCustomer;
  lines: ResolvedInquiryLine[];
  subtotalExclTax: number;
  taxAmount: number;
  totalInclTax: number;
  sentAt?: Date;
}): OrderInquiryEmailContent {
  const { catalog, customer, lines } = params;
  const sentAt = params.sentAt ?? new Date();
  const catalogLabel = catalog.edition
    ? `${catalog.title} (${catalog.edition})`
    : catalog.title;
  const customerName = formatCustomerName(customer);

  const subject = `Katalog-Anfrage: ${customerName} — ${catalog.title}`;

  const customerRows = buildCustomerRows(customer);
  const customerBlock = customerRows
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  const articleBlocks = lines
    .map((line, index) => {
      const parts = [
        `${index + 1}. ${lineLabel(line)} (Art. ${line.sku})`,
        line.shortDescription &&
        line.shortDescription.trim().toLowerCase() !==
          (line.variant?.trim().toLowerCase() ?? "")
          ? `   ${line.shortDescription}`
          : null,
        `   Menge: ${line.quantity}`,
        `   Einzelpreis (netto): ${formatEur(line.unitPriceExclTax)}`,
        `   Zeilenbetrag (netto): ${formatEur(line.subtotalExclTax)}`,
        `   inkl. MwSt.: ${formatEur(line.totalInclTax)}`,
      ];
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");

  const summaryBlock = [
    `Summe netto:   ${formatEur(params.subtotalExclTax)}`,
    `MwSt.:         ${formatEur(params.taxAmount)}`,
    `Gesamt brutto: ${formatEur(params.totalInclTax)}`,
  ].join("\n");

  const text = [
    "Neue Katalog-Anfrage",
    "====================",
    "",
    `Katalog: ${catalogLabel}`,
    `Slug:    ${catalog.slug}`,
    `Datum:   ${formatTimestamp(sentAt)}`,
    "",
    "KONTAKTDATEN",
    "------------",
    customerBlock,
    "",
    "ARTIKEL",
    "-------",
    articleBlocks,
    "",
    "ZUSAMMENFASSUNG",
    "---------------",
    summaryBlock,
  ].join("\n");

  const customerTable = customerRows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top;color:#666;white-space:nowrap;">${escapeHtml(label)}</th><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const articleRows = lines
    .map(
      (line) => `<tr>
  <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(line.sku)}</td>
  <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(lineLabel(line))}</td>
  <td style="padding:8px;border:1px solid #ddd;text-align:center;">${line.quantity}</td>
  <td style="padding:8px;border:1px solid #ddd;text-align:right;">${escapeHtml(formatEur(line.unitPriceExclTax))}</td>
  <td style="padding:8px;border:1px solid #ddd;text-align:right;">${escapeHtml(formatEur(line.subtotalExclTax))}</td>
  <td style="padding:8px;border:1px solid #ddd;text-align:right;">${escapeHtml(formatEur(line.totalInclTax))}</td>
</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de">
<body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5;">
  <h2 style="margin:0 0 8px;">Neue Katalog-Anfrage</h2>
  <p style="margin:0 0 16px;color:#555;">
    <strong>Katalog:</strong> ${escapeHtml(catalogLabel)}<br>
    <strong>Datum:</strong> ${escapeHtml(formatTimestamp(sentAt))}
  </p>

  <h3 style="margin:24px 0 8px;">Kontaktdaten</h3>
  <table style="border-collapse:collapse;">${customerTable}</table>

  <h3 style="margin:24px 0 8px;">Artikel</h3>
  <table style="border-collapse:collapse;width:100%;max-width:720px;font-size:14px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px;border:1px solid #ddd;text-align:left;">Art.-Nr.</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:left;">Bezeichnung</th>
        <th style="padding:8px;border:1px solid #ddd;">Menge</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right;">Einzel netto</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right;">Zeile netto</th>
        <th style="padding:8px;border:1px solid #ddd;text-align:right;">Brutto</th>
      </tr>
    </thead>
    <tbody>${articleRows}</tbody>
  </table>

  <h3 style="margin:24px 0 8px;">Zusammenfassung</h3>
  <table style="border-collapse:collapse;min-width:280px;">
    <tr><td style="padding:4px 16px 4px 0;">Summe netto</td><td align="right">${escapeHtml(formatEur(params.subtotalExclTax))}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;">MwSt.</td><td align="right">${escapeHtml(formatEur(params.taxAmount))}</td></tr>
    <tr><td style="padding:4px 16px 4px 0;font-weight:bold;">Gesamt brutto</td><td align="right" style="font-weight:bold;">${escapeHtml(formatEur(params.totalInclTax))}</td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
