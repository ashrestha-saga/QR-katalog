import { notFound } from "next/navigation";
import { ArticleConfigure } from "@/components/ArticleConfigure";
import { getCatalog } from "@/lib/catalog";
import { fetchArticleBySku } from "@/lib/product-source";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ catalogSlug: string; sku: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function ArticleConfigurePage({ params, searchParams }: Props) {
  const { catalogSlug, sku } = await params;
  const { edit } = await searchParams;
  const catalog = getCatalog(catalogSlug);
  const product = await fetchArticleBySku(sku);

  if (!catalog || !product) {
    notFound();
  }

  return (
    <ArticleConfigure
      catalog={catalog}
      product={product}
      editCartSku={edit?.trim() || undefined}
    />
  );
}
