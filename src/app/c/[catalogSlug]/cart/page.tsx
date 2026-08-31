import { notFound, redirect } from "next/navigation";
import { WishlistCart } from "@/components/WishlistCart";
import { getCatalog } from "@/lib/catalog";
import { isInquiryCatalogMode } from "@/lib/order-mode";

type Props = {
  params: Promise<{ catalogSlug: string }>;
};

export default async function CatalogCartPage({ params }: Props) {
  const { catalogSlug } = await params;
  const catalog = getCatalog(catalogSlug);

  if (!catalog) {
    notFound();
  }

  if (isInquiryCatalogMode()) {
    redirect(`/c/${catalogSlug}`);
  }

  return <WishlistCart catalog={catalog} />;
}
