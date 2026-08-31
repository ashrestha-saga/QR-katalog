import { z } from "zod";
import type {
  InquiryCustomer,
  OrderInquiryLineInput,
  OrderInquiryMeta,
} from "@/lib/order-inquiry-types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^\d{4,10}$/;
const SALUTATIONS = ["herr", "frau", "d"] as const;

function trim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const trimmedString = z.preprocess((v) => trim(v), z.string());

const optionalTrimmedString = trimmedString.transform((v) =>
  v.length > 0 ? v : undefined
);

const requiredTrimmed = (message: string) =>
  trimmedString.refine((v) => v.length > 0, message);

const emailField = trimmedString.refine(
  (v) => v.length > 0 && EMAIL_RE.test(v),
  "valid email required"
);

const catalogPostalCodeField = trimmedString.refine(
  (v) => v.length > 0 && POSTAL_RE.test(v),
  "valid postalCode required"
);

const salutationField = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : ""),
  z.enum(SALUTATIONS, "salutation required")
);

const catalogCustomerSchema = z.object({
  formType: z.literal("catalog"),
  firstName: requiredTrimmed("firstName required"),
  lastName: requiredTrimmed("lastName required"),
  facility: requiredTrimmed("facility required"),
  postalCode: catalogPostalCodeField,
  email: emailField,
  message: optionalTrimmedString,
});

const legacyCustomerSchema = z.object({
  formType: z.literal("legacy"),
  facility: requiredTrimmed("facility required"),
  position: optionalTrimmedString,
  salutation: salutationField,
  title: optionalTrimmedString,
  firstName: requiredTrimmed("firstName required"),
  lastName: requiredTrimmed("lastName required"),
  email: emailField,
  street: requiredTrimmed("street required"),
  houseNumber: requiredTrimmed("houseNumber required"),
  postalCode: requiredTrimmed("postalCode required"),
  city: requiredTrimmed("city required"),
  country: requiredTrimmed("country required"),
  phone: requiredTrimmed("phone required"),
  message: optionalTrimmedString,
});

const customerSchema = z.discriminatedUnion("formType", [
  catalogCustomerSchema,
  legacyCustomerSchema,
]);

const variantDimensionSchema = z
  .object({ label: trimmedString, value: trimmedString })
  .transform((d) =>
    d.label && d.value ? { label: d.label, value: d.value } : null
  );

const metaSchema = z
  .object({
    source: optionalTrimmedString,
    capturedAt: optionalTrimmedString,
    variantDimensions: z.unknown().transform((raw) => {
      if (!Array.isArray(raw)) return undefined;
      const cleaned: Array<{ label: string; value: string }> = [];
      for (const entry of raw) {
        const parsed = variantDimensionSchema.safeParse(entry);
        if (parsed.success && parsed.data) cleaned.push(parsed.data);
      }
      return cleaned.length > 0 ? cleaned : undefined;
    }),
  })
  .transform((m): OrderInquiryMeta | null => {
    if (!m.source && !m.capturedAt && !m.variantDimensions) return null;
    return {
      ...(m.source ? { source: m.source } : {}),
      ...(m.capturedAt ? { capturedAt: m.capturedAt } : {}),
      ...(m.variantDimensions ? { variantDimensions: m.variantDimensions } : {}),
    };
  });

const linesSchema = z
  .unknown()
  .transform((raw, ctx): OrderInquiryLineInput[] => {
    if (!Array.isArray(raw) || raw.length === 0) {
      ctx.addIssue("lines required");
      return z.NEVER;
    }
    const out: OrderInquiryLineInput[] = [];
    for (const row of raw) {
      if (!row || typeof row !== "object") {
        ctx.addIssue("invalid line");
        return z.NEVER;
      }
      const entry = row as Record<string, unknown>;
      const sku = trim(entry.sku) || trim(entry.product_id);
      if (!sku) {
        ctx.addIssue("sku required on each line");
        return z.NEVER;
      }
      const q = Math.floor(Number(entry.quantity) || 1);
      out.push({ sku, quantity: Math.max(1, Math.min(99, q)) });
    }
    return out;
  });

function firstError(err: z.ZodError, fallback: string): string {
  return err.issues[0]?.message ?? fallback;
}

export function parseOrderInquiryCustomer(
  raw: unknown,
  formType: unknown = "legacy"
): { customer: InquiryCustomer } | { error: string } {
  if (!raw || typeof raw !== "object") {
    return { error: "customer required" };
  }

  const kind =
    typeof formType === "string" && formType.trim().toLowerCase() === "catalog"
      ? "catalog"
      : "legacy";

  const result = customerSchema.safeParse({
    ...(raw as Record<string, unknown>),
    formType: kind,
  });

  if (!result.success) {
    return { error: firstError(result.error, "invalid customer") };
  }
  return { customer: result.data as InquiryCustomer };
}

export function parseOrderInquiryMeta(raw: unknown): OrderInquiryMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const result = metaSchema.safeParse(raw);
  return result.success ? result.data : null;
}

export function parseOrderInquiryLines(
  raw: unknown
): { lines: OrderInquiryLineInput[] } | { error: string } {
  const result = linesSchema.safeParse(raw);
  if (!result.success) {
    return { error: firstError(result.error, "lines required") };
  }
  return { lines: result.data };
}
