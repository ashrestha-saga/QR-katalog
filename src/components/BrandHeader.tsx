import Image from "next/image";
import { CartIconButton } from "./CartIconButton";

type Props = {
  title?: string;
  subtitle?: string;
  badge?: string;
  cartCatalogSlug?: string;
  cartHref?: string;
};

export function BrandHeader({
  subtitle = "Multi-Händler-Verteilseite · Printkatalog",
  badge = "Prototype",
  cartCatalogSlug,
  cartHref,
}: Props) {
  const showCart = Boolean(cartCatalogSlug && cartHref);

  return (
    <header className="brand-header">
      <Image
        src="/logo/Med Sales Logo.svg"
        alt="Med Sales"
        width={181}
        height={40}
        className="h-9 w-auto shrink-0"
        priority
      />
      <div className="min-w-0 flex-1">
        {subtitle ? (
          <div className="text-center text-[13px] text-quinary">{subtitle}</div>
        ) : null}
      </div>
      <div className="brand-header-actions">
        {showCart ? (
          <CartIconButton catalogSlug={cartCatalogSlug!} href={cartHref!} />
        ) : null}
        {badge ? <div className="badge-version">{badge}</div> : null}
      </div>
    </header>
  );
}
