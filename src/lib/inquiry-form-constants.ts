export type InquirySalutation = "herr" | "frau" | "d";

export const INQUIRY_SALUTATIONS: Array<{
  value: InquirySalutation;
  label: string;
}> = [
  { value: "herr", label: "Herr" },
  { value: "frau", label: "Frau" },
  { value: "d", label: "D" },
];

export const INQUIRY_TITLES = [
  { value: "", label: "—" },
  { value: "Dr. med.", label: "Dr. med." },
  { value: "Prof. Dr. med.", label: "Prof. Dr. med." },
] as const;

export const INQUIRY_COUNTRIES = [
  { value: "", label: "Bitte auswählen…" },
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
  { value: "NL", label: "Niederlande" },
  { value: "BE", label: "Belgien" },
  { value: "LU", label: "Luxemburg" },
  { value: "FR", label: "Frankreich" },
  { value: "IT", label: "Italien" },
  { value: "PL", label: "Polen" },
  { value: "CZ", label: "Tschechien" },
  { value: "DK", label: "Dänemark" },
] as const;

const SALUTATION_LABELS: Record<InquirySalutation, string> = {
  herr: "Herr",
  frau: "Frau",
  d: "Divers",
};

export function formatInquirySalutation(
  salutation: InquirySalutation,
  title?: string
): string {
  const parts = [SALUTATION_LABELS[salutation]];
  if (title?.trim()) parts.push(title.trim());
  return parts.join(" ");
}

export function getInquiryCountryLabel(code: string): string {
  const match = INQUIRY_COUNTRIES.find((entry) => entry.value === code);
  return match?.label ?? code;
}
