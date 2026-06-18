/** Catalog slug for this deployment (one company per instance). */
export const DEFAULT_CATALOG_SLUG =
  process.env.NEXT_PUBLIC_CATALOG_SLUG?.trim() || "catalog";
