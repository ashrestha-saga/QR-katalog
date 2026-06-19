import type { InquirySalutation } from "@/lib/inquiry-form-constants";

export type OrderInquiryCustomer = {
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

export type OrderInquiryLineInput = {
  sku: string;
  quantity: number;
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
