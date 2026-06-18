import { notFound } from "next/navigation";
import { ArticleConfigure } from "@/components/ArticleConfigure";
import { getCatalog } from "@/lib/catalog";
import { fetchArticleBySku } from "@/lib/product-source";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ catalogSlug: string; sku: string }>;
};

export default async function ArticleConfigurePage({ params }: Props) {
  const { catalogSlug, sku } = await params;
  const catalog = getCatalog(catalogSlug);
  const product = await fetchArticleBySku(sku);

  if (!catalog || !product) {
    notFound();
  }

  return <ArticleConfigure catalog={catalog} product={product} />;
}
