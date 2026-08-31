import type { InquirySalutation } from "@/lib/inquiry-form-constants";

/** Legacy modal form — full postal address + salutation */
export type LegacyInquiryCustomer = {
  formType: "legacy";
  facility: string;
  position?: string;
  salutation: InquirySalutation;
  title?: string;
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  message?: string;
};

/** Catalog page form — minimal fields matching mockup */
export type CatalogInquiryCustomer = {
  formType: "catalog";
  firstName: string;
  lastName: string;
  facility: string;
  postalCode: string;
  email: string;
  message?: string;
};

export type InquiryCustomer = LegacyInquiryCustomer | CatalogInquiryCustomer;

/** @deprecated Prefer InquiryCustomer with formType discriminator */
export type OrderInquiryCustomer = LegacyInquiryCustomer;

export type OrderInquiryLineInput = {
  sku: string;
  quantity: number;
};

/** Optional context attached to a catalog inquiry (source, capture time, variant dimensions). */
export type OrderInquiryMeta = {
  source?: string;
  capturedAt?: string;
  variantDimensions?: Array<{ label: string; value: string }>;
};

export type ResolvedInquiryLine = {
  sku: string;
  quantity: number;
  name: string;
  variant?: string;
  unitName?: string;
  shortDescription?: string;
  unitPriceExclTax: number;
  taxRate: number;
  subtotalExclTax: number;
  taxAmount: number;
  totalInclTax: number;
};

/** One article row in the post-submit confirmation card. */
export type InquirySuccessItem = {
  name: string;
  configuration?: string;
  quantity: number;
  unitName?: string;
};

/** Everything the "Anfrage ist raus" confirmation page needs to render. */
export type InquirySuccessSummary = {
  inquiryNumber: string;
  email: string;
  customerName: string;
  facility: string;
  postalCode?: string;
  message?: string;
  items: InquirySuccessItem[];
};
