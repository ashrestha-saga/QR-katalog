import { notFound } from "next/navigation";
import { CatalogLanding } from "@/components/CatalogLanding";
import { getCatalog } from "@/lib/catalog";

type Props = {
  params: Promise<{ catalogSlug: string }>;
};

export default async function CatalogPage({ params }: Props) {
  const { catalogSlug } = await params;
  const catalog = getCatalog(catalogSlug);

  if (!catalog) {
    notFound();
  }

  return <CatalogLanding catalog={catalog} />;
}
