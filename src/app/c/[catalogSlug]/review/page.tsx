import { redirect } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { isInquiryCatalogMode } from "@/lib/order-mode";

type Props = {
  params: Promise<{ catalogSlug: string }>;
};

/** Legacy route — cart is the editable overview */
export default async function CatalogReviewRedirect({ params }: Props) {
  const { catalogSlug } = await params;
  const catalog = getCatalog(catalogSlug);

  if (!catalog) {
    redirect("/");
  }

  redirect(isInquiryCatalogMode() ? `/c/${catalogSlug}` : `/c/${catalogSlug}/cart`);
}
