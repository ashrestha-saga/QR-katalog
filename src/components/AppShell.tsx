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
  unifiedCard?: boolean;
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
  unifiedCard = false,
}: Props) {
  const containerClass = `app-container min-h-dvh${
    unifiedCard ? " app-container-unified" : ""
  }${containerClassName ? ` ${containerClassName}` : ""}`;

  if (unifiedCard) {
    return (
      <div className={containerClass}>
        <div className="app-unified-card">
          {showBrand ? (
            <BrandHeader
              title={brandTitle}
              subtitle={brandSubtitle}
              badge={brandBadge}
              cartCatalogSlug={cartCatalogSlug}
              cartHref={cartHref}
              attached
            />
          ) : null}
          <div className="app-unified-main">{children}</div>
          {footer ? <footer className="app-footer">{footer}</footer> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
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
