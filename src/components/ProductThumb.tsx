import type { Product } from "@/lib/mock-data";

type Props = {
  product?: Pick<Product, "name" | "thumbnailUrl"> | null;
  className?: string;
  imageClassName?: string;
};

export function ProductThumb({
  product,
  className = "h-14 w-14 rounded-[10px]",
  imageClassName = "p-1.5",
}: Props) {
  const baseClassName = `${className} product-thumb shrink-0 overflow-hidden border border-mercury bg-white shadow-sm`;

  if (!product?.thumbnailUrl) {
    return (
      <div className={baseClassName} aria-hidden>
        📦
      </div>
    );
  }

  return (
    <div className={baseClassName}>
      <img
        src={product.thumbnailUrl}
        alt={`${product.name} Vorschaubild`}
        className={`h-full w-full object-contain ${imageClassName}`}
      />
    </div>
  );
}
