import { COMPANY } from "@/lib/company";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";

export type Catalog = {
  slug: string;
  companyName: string;
  title: string;
  edition: string;
  tagline: string;
};

/**
 * Single, env-configured catalog for this deployment. Each company is hosted as
 * its own project, so there is exactly one catalog per instance — configured via
 * environment variables (see `.env.example`).
 */
function getConfiguredCatalog(): Catalog {
  return {
    slug: DEFAULT_CATALOG_SLUG,
    companyName: COMPANY.name,
    title: process.env.CATALOG_TITLE?.trim() || COMPANY.name,
    edition: process.env.CATALOG_EDITION?.trim() || "",
    tagline:
      process.env.CATALOG_TAGLINE?.trim() ||
      "Scan an article QR code in the catalog to continue.",
  };
}

/** Resolve the catalog for a given slug — only the configured slug is valid. */
export function getCatalog(slug: string): Catalog | undefined {
  const catalog = getConfiguredCatalog();
  return slug === catalog.slug ? catalog : undefined;
}
