import Image from "next/image";
import Link from "next/link";
import { CartIconButton } from "./CartIconButton";

type Props = {
  title?: string;
  subtitle?: string;
  badge?: string;
  cartCatalogSlug?: string;
  cartHref?: string;
  homeHref?: string;
  attached?: boolean;
};

export function BrandHeader({
  subtitle = "Multi-Händler-Verteilseite · Printkatalog",
  badge = "Prototype",
  cartCatalogSlug,
  cartHref,
  homeHref = "/",
  attached = false,
}: Props) {
  const showCart = Boolean(cartCatalogSlug && cartHref);

  return (
    <header className={attached ? "brand-header-attached" : "brand-header"}>
      <Link
        href={homeHref}
        className="brand-logo-link shrink-0"
        aria-label="Zur Startseite"
      >
        <Image
          src="/logo/Med Sales Logo.svg"
          alt="Med Sales"
          width={181}
          height={40}
          className="h-9 w-auto"
          priority
        />
      </Link>
      {!attached && subtitle ? (
        <div className="min-w-0 flex-1">
          <div className="text-center text-[13px] text-quinary">{subtitle}</div>
        </div>
      ) : (
        <div className="min-w-0 flex-1" aria-hidden />
      )}
      <div className="brand-header-actions">
        {showCart ? (
          <CartIconButton catalogSlug={cartCatalogSlug!} href={cartHref!} />
        ) : null}
        {badge ? <div className="badge-version">{badge}</div> : null}
      </div>
    </header>
  );
}
