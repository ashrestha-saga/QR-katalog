import type { ReactNode } from "react";
import type { Product } from "@/lib/mock-data";
import {
  formatVariantWithUnit,
  shouldShowShortDescription,
} from "@/lib/product-format";
import { ProductThumb } from "./ProductThumb";

type Props = {
  product: Product;
  thumb?: ReactNode;
  showThumb?: boolean;
  showEdition?: boolean;
  showDetailsHint?: boolean;
  showDeliveryScope?: boolean;
  nameClassName?: string;
  compact?: boolean;
};

export function ProductSideSummary({
  product,
  thumb,
  showThumb = true,
  showEdition = false,
  showDetailsHint = false,
  showDeliveryScope = false,
  nameClassName = "text-[15px] font-semibold text-primary md:text-base",
  compact = false,
}: Props) {
  const variantLine = formatVariantWithUnit(product);

  return (
    <div
      className={
        compact
          ? "min-w-0 text-left"
          : "flex items-center gap-4 text-left"
      }
    >
      {showThumb ? thumb ?? <ProductThumb product={product} /> : null}
      <div className="min-w-0 flex-1">
        <div className="article-product-sku">Artikel {product.sku}</div>
        <div className={nameClassName}>{product.name}</div>
        {variantLine ? (
          <div className="article-product-spec">{variantLine}</div>
        ) : null}
        {showEdition && product.catalogEdition ? (
          <div className="mt-1 text-[11px] text-quinary md:text-[13px]">
            Edition {product.catalogEdition}
          </div>
        ) : null}
        {showDetailsHint ? (
          <div className="mt-2 text-xs font-medium text-accent-blue">
            Details und Bilder ansehen
          </div>
        ) : null}
      </div>
    </div>
  );
}
