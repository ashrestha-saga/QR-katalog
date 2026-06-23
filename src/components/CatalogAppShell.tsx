"use client";

import type { ReactNode } from "react";
import type { Catalog } from "@/lib/catalog";
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
  const cartHref = `/c/${catalog.slug}/cart`;
  const homeHref = `/c/${catalog.slug}`;

  return (
    <AppShell
      brandTitle={catalog.companyName}
      brandSubtitle={brandSubtitle}
      brandBadge={brandBadge}
      cartCatalogSlug={catalog.slug}
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
