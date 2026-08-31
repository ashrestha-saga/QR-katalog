"use client";

import type { ReactNode } from "react";
import type { Catalog } from "@/lib/catalog";
import { isInquiryCatalogMode } from "@/lib/order-mode";
import { AppShell } from "./AppShell";

type Props = {
  catalog: Catalog;
  children: ReactNode;
  brandSubtitle?: string;
  brandBadge?: string;
  footer?: ReactNode;
  containerClassName?: string;
  unifiedCard?: boolean;
};

export function CatalogAppShell({
  catalog,
  children,
  brandSubtitle,
  brandBadge,
  footer,
  containerClassName,
  unifiedCard = false,
}: Props) {
  const showCart = !isInquiryCatalogMode();
  const cartHref = showCart ? `/c/${catalog.slug}/cart` : undefined;
  const homeHref = `/c/${catalog.slug}`;

  return (
    <AppShell
      brandTitle={catalog.companyName}
      brandSubtitle={brandSubtitle}
      brandBadge={brandBadge}
      cartCatalogSlug={showCart ? catalog.slug : undefined}
      cartHref={cartHref}
      homeHref={homeHref}
      footer={footer}
      containerClassName={containerClassName}
      unifiedCard={unifiedCard}
    >
      {children}
    </AppShell>
  );
}
