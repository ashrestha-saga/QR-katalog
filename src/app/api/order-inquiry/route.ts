import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { buildOrderInquiryEmail } from "@/lib/order-inquiry-email";
import type { ResolvedInquiryLine } from "@/lib/order-inquiry-types";
import {
  parseOrderInquiryCustomer,
  parseOrderInquiryLines,
  parseOrderInquiryMeta,
} from "@/lib/order-inquiry-validate";
import { getOrderMode } from "@/lib/order-mode";
import { calcBasketTotals, calcLineTotals } from "@/lib/pricing";
import { fetchArticleBySku } from "@/lib/product-source";
import {
  createSmtpTransport,
  getOrderInquiryRecipient,
  getSmtpFromAddress,
  isSmtpConfigured,
} from "@/lib/smtp";

export const preferredRegion = "fra1";

/** Human-readable ref for the confirmation card + email subject. Not persisted. */
function generateInquiryNumber(now: Date = new Date()): string {
  const year = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `ANF-${year}-${seq}`;
}

/** POST /api/order-inquiry — customer form + cart lines → SMTP email to shop owner */
export async function POST(request: Request) {
  if (getOrderMode() !== "inquiry") {
    return NextResponse.json(
      { error: "Order inquiry is not enabled for this deployment" },
      { status: 400 }
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      { error: "SMTP is not configured on the server" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));

  if (trimString(body.website)) {
    return NextResponse.json({ ok: true });
  }

  const catalogSlug = trimString(body.catalog);
  if (!catalogSlug) {
    return NextResponse.json({ error: "catalog required" }, { status: 400 });
  }

  const catalog = getCatalog(catalogSlug);
  if (!catalog) {
    return NextResponse.json({ error: "invalid catalog" }, { status: 400 });
  }

  const parsedCustomer = parseOrderInquiryCustomer(body.customer, body.formType);
  if ("error" in parsedCustomer) {
    return NextResponse.json({ error: parsedCustomer.error }, { status: 400 });
  }

  const parsedLines = parseOrderInquiryLines(body.lines);
  if ("error" in parsedLines) {
    return NextResponse.json({ error: parsedLines.error }, { status: 400 });
  }

  const meta = parseOrderInquiryMeta(body.meta);

  const resolvedLines: ResolvedInquiryLine[] = [];

  for (const line of parsedLines.lines) {
    const product = await fetchArticleBySku(line.sku);
    if (!product) {
      return NextResponse.json(
        { error: `unknown product: ${line.sku}` },
        { status: 400 }
      );
    }

    const totals = calcLineTotals(
      line.quantity,
      product.unitPriceExclTax,
      product.taxRate
    );

    resolvedLines.push({
      sku: line.sku,
      quantity: totals.quantity,
      name: product.name,
      variant: product.variant,
      unitName: product.unitName,
      shortDescription: product.shortDescription,
      unitPriceExclTax: totals.unitPriceExclTax,
      taxRate: totals.taxRate,
      subtotalExclTax: totals.subtotalExclTax,
      taxAmount: totals.taxAmount,
      totalInclTax: totals.totalInclTax,
    });
  }

  const basketTotals = calcBasketTotals(
    resolvedLines.map((line) => ({
      quantity: line.quantity,
      unitPriceExclTax: line.unitPriceExclTax,
      taxRate: line.taxRate,
    }))
  );

  const inquiryNumber = generateInquiryNumber();

  const email = buildOrderInquiryEmail({
    catalog,
    customer: parsedCustomer.customer,
    lines: resolvedLines,
    subtotalExclTax: basketTotals.subtotalExclTax,
    taxAmount: basketTotals.taxAmount,
    totalInclTax: basketTotals.totalInclTax,
    meta,
    inquiryNumber,
  });

  try {
    const transport = createSmtpTransport();
    await transport.sendMail({
      from: getSmtpFromAddress(),
      to: getOrderInquiryRecipient(),
      replyTo: parsedCustomer.customer.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    console.error("[order-inquiry] SMTP:", error);
    return NextResponse.json(
      { error: "E-Mail konnte nicht gesendet werden." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, inquiryNumber });
}

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
