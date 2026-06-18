import type { ReactNode } from "react";
import { BrandHeader } from "./BrandHeader";

type Props = {
  children: ReactNode;
  showBrand?: boolean;
  brandTitle?: string;
  brandSubtitle?: string;
  brandBadge?: string;
  cartCatalogSlug?: string;
  cartHref?: string;
  footer?: ReactNode;
  containerClassName?: string;
};

export function AppShell({
  children,
  showBrand = true,
  brandTitle,
  brandSubtitle,
  brandBadge,
  cartCatalogSlug,
  cartHref,
  footer,
  containerClassName,
}: Props) {
  return (
    <div
      className={`app-container min-h-dvh${containerClassName ? ` ${containerClassName}` : ""}`}
    >
      {showBrand ? (
        <BrandHeader
          title={brandTitle}
          subtitle={brandSubtitle}
          badge={brandBadge}
          cartCatalogSlug={cartCatalogSlug}
          cartHref={cartHref}
        />
      ) : null}
      <div className="app-main">{children}</div>
      {footer ? <footer className="app-footer">{footer}</footer> : null}
    </div>
  );
}
