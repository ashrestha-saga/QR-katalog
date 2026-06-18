import { notFound } from "next/navigation";
import { ArticleQrScanner } from "@/components/ArticleQrScanner";
import { getCatalog } from "@/lib/catalog";

type Props = {
  params: Promise<{ catalogSlug: string }>;
};

export default async function CatalogScanPage({ params }: Props) {
  const { catalogSlug } = await params;
  const catalog = getCatalog(catalogSlug);

  if (!catalog) {
    notFound();
  }

  return <ArticleQrScanner catalog={catalog} />;
}
