/**
 * Company information used across the UI (footer, metadata, etc.).
 *
 * Values are sourced from environment variables (see `.env.local`) so the
 * deployment can be re-skinned for a different company without code changes.
 * Each field falls back to a sensible default when its env var is absent.
 */

export type CompanyInfo = {
  name: string;
  street: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  websiteUrl: string;
  kontaktUrl: string;
  impressumUrl: string;
};

/** Resolve an env var, falling back to the default when unset/blank. */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

export const COMPANY: CompanyInfo = {
  name: env("COMPANY_NAME", "Merzljak Werbe- und Verlagsgesellschaft mbH"),
  street: env("COMPANY_STREET", "In der Raste 14"),
  city: env("COMPANY_CITY", "53129 Bonn"),
  country: env("COMPANY_COUNTRY", "Deutschland"),
  phone: env("COMPANY_PHONE", "0228 - 93 54 95 - 0"),
  email: env("COMPANY_EMAIL", "noreply@arztcoupon.de"),
  website: env("COMPANY_WEBSITE", "www.merzljak.de"),
  websiteUrl: env("COMPANY_WEBSITE_URL", "https://www.merzljak.de"),
  kontaktUrl: env("COMPANY_KONTAKT_URL", "https://www.merzljak.de/kontakt"),
  impressumUrl: env("COMPANY_IMPRESSUM_URL", "https://www.merzljak.de/impressum"),
};
