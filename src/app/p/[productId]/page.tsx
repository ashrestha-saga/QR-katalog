import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductRouteClient } from "./ProductRouteClient";
import { DEFAULT_CATALOG_SLUG } from "@/lib/catalog-constants";
import { fetchArticleBySku } from "@/lib/product-source";

export const preferredRegion = "fra1";

type Props = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ reset?: string; catalog?: string; from?: string }>;
};

export default async function ProductPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { reset, catalog, from } = await searchParams;

  // Article details come from the shop API — full details shown only after the
  // scan gate (client). Pricing fields are needed by the wizard/cart.
  const product = await fetchArticleBySku(productId);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductRouteClient
        product={product}
        catalogSlug={catalog ?? null}
        fromScan={from === "scan"}
        forceWizard={reset === "1"}
      />
      <footer className="app-footer">
        <Link href={`/c/${catalog ?? DEFAULT_CATALOG_SLUG}`} className="underline">
          Zum Katalog
        </Link>
      </footer>
    </>
  );
}
