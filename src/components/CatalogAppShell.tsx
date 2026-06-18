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
};

export function CatalogAppShell({
  catalog,
  children,
  brandSubtitle,
  brandBadge,
  footer,
  containerClassName,
}: Props) {
  const cartHref = `/c/${catalog.slug}/cart`;

  return (
    <AppShell
      brandTitle={catalog.companyName}
      brandSubtitle={brandSubtitle}
      brandBadge={brandBadge}
      cartCatalogSlug={catalog.slug}
      cartHref={cartHref}
      footer={footer}
      containerClassName={containerClassName}
    >
      {children}
    </AppShell>
  );
}
