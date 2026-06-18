import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/CatalogLanding";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { getCatalog } from "@/lib/catalog";

export default function HomePage() {
  const catalog = getCatalog(DEFAULT_CATALOG_SLUG);

  if (!catalog) {
    notFound();
  }

  return <CatalogLanding catalog={catalog} />;
}
