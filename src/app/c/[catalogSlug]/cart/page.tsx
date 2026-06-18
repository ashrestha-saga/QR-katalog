import { notFound } from "next/navigation";
import { WishlistCart } from "@/components/WishlistCart";
import { getCatalog } from "@/lib/catalog";

type Props = {
  params: Promise<{ catalogSlug: string }>;
};

export default async function CatalogCartPage({ params }: Props) {
  const { catalogSlug } = await params;
  const catalog = getCatalog(catalogSlug);

  if (!catalog) {
    notFound();
  }

  return <WishlistCart catalog={catalog} />;
}
