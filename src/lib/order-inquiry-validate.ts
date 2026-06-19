import type { InquirySalutation } from "@/lib/inquiry-form-constants";
import type { OrderInquiryCustomer, OrderInquiryLineInput } from "@/lib/order-inquiry-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SALUTATIONS = new Set<InquirySalutation>(["herr", "frau", "d"]);

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseOrderInquiryCustomer(
  raw: unknown
): { customer: OrderInquiryCustomer } | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "customer required" };
  }

  const body = raw as Record<string, unknown>;
  const salutation = trim(body.salutation).toLowerCase() as InquirySalutation;

  const customer: OrderInquiryCustomer = {
    facility: trim(body.facility),
    position: trim(body.position) || undefined,
    salutation,
    title: trim(body.title) || undefined,
    firstName: trim(body.firstName),
    lastName: trim(body.lastName),
    email: trim(body.email),
    street: trim(body.street),
    houseNumber: trim(body.houseNumber),
    postalCode: trim(body.postalCode),
    city: trim(body.city),
    country: trim(body.country),
    phone: trim(body.phone),
    message: trim(body.message) || undefined,
  };

  if (!customer.facility) return { error: "facility required" };
  if (!VALID_SALUTATIONS.has(customer.salutation)) {
    return { error: "salutation required" };
  }
  if (!customer.firstName) return { error: "firstName required" };
  if (!customer.lastName) return { error: "lastName required" };
  if (!customer.email || !EMAIL_RE.test(customer.email)) {
    return { error: "valid email required" };
  }
  if (!customer.street) return { error: "street required" };
  if (!customer.houseNumber) return { error: "houseNumber required" };
  if (!customer.postalCode) return { error: "postalCode required" };
  if (!customer.city) return { error: "city required" };
  if (!customer.country) return { error: "country required" };
  if (!customer.phone) return { error: "phone required" };

  return { customer };
}

export function parseOrderInquiryLines(
  raw: unknown
): { lines: OrderInquiryLineInput[] } | { error: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { error: "lines required" };
  }

  const lines: OrderInquiryLineInput[] = [];

  for (const row of raw) {
    if (!row || typeof row !== "object") {
      return { error: "invalid line" };
    }
    const entry = row as Record<string, unknown>;
    const sku = trim(entry.sku) || trim(entry.product_id);
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(entry.quantity) || 1)));

    if (!sku) return { error: "sku required on each line" };
    lines.push({ sku, quantity });
  }

  return { lines };
}
