import { notFound, redirect } from "next/navigation";
import { ArticleConfigure } from "@/components/ArticleConfigure";
import { getCatalog } from "@/lib/catalog";
import { fetchArticleBySku } from "@/lib/product-source";
import { grantAllowsSku, readScanGrant } from "@/lib/scan-grant";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ catalogSlug: string; sku: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export default async function ArticleConfigurePage({ params, searchParams }: Props) {
  const { catalogSlug, sku: rawSku } = await params;
  const { edit } = await searchParams;
  const sku = decodeURIComponent(rawSku).trim();
  const catalog = getCatalog(catalogSlug);

  if (!catalog || !sku) {
    notFound();
  }

  const grant = await readScanGrant();
  const allowed =
    grantAllowsSku(grant, catalog.slug, sku) ||
    (edit?.trim()
      ? grantAllowsSku(grant, catalog.slug, edit.trim())
      : false);

  if (!allowed) {
    redirect(`/c/${catalog.slug}/scan`);
  }

  const product = await fetchArticleBySku(sku);

  if (!product) {
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
