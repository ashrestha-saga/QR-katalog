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
  showEdition?: boolean;
  showDetailsHint?: boolean;
  showDeliveryScope?: boolean;
  nameClassName?: string;
};

export function ProductSideSummary({
  product,
  thumb,
  showEdition = false,
  showDetailsHint = false,
  showDeliveryScope = false,
  nameClassName = "text-[15px] font-semibold text-primary md:text-base",
}: Props) {
  const variantLine = formatVariantWithUnit(product);

  return (
    <div className="flex items-center gap-3 text-left">
      {thumb ?? <ProductThumb product={product} />}
      <div className="min-w-0 flex-1">
        <div className="product-label">Artikel {product.sku}</div>
        <div className={nameClassName}>{product.name}</div>
        {variantLine ? (
          <div className="mt-0.5 text-[13px] font-medium text-secondary md:text-sm">
            {variantLine}
          </div>
        ) : null}
        {shouldShowShortDescription(product) ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-quinary md:text-sm">
            {product.shortDescription}
          </p>
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
