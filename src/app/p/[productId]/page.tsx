import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductRouteClient } from "./ProductRouteClient";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { fetchArticleBySku } from "@/lib/product-source";
import { isScanGrantRequired } from "@/lib/order-mode";
import { grantAllowsSku, readScanGrant } from "@/lib/scan-grant";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ reset?: string; catalog?: string }>;
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { reset, catalog } = await searchParams;
  const sku = decodeURIComponent(productId).trim();
  const catalogSlug = catalog?.trim() || DEFAULT_CATALOG_SLUG;

  if (!sku) {
    notFound();
  }

  if (isScanGrantRequired()) {
    const grant = await readScanGrant();
    if (!grantAllowsSku(grant, catalogSlug, sku)) {
      redirect(`/c/${catalogSlug}/scan`);
    }
  }

  const product = await fetchArticleBySku(sku);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductRouteClient
        product={product}
        catalogSlug={catalogSlug}
        fromScan
        forceWizard={reset === "1"}
      />
      <footer className="app-footer">
        <Link href={`/c/${catalogSlug}`} className="underline">
          Zum Katalog
        </Link>
      </footer>
    </>
  );
}
