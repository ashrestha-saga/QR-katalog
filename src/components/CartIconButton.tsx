"use client";

import Link from "next/link";
import { useCartCount } from "@/hooks/useCartCount";

type Props = {
  catalogSlug: string;
  href: string;
};

export function CartIconButton({ catalogSlug, href }: Props) {
  const count = useCartCount(catalogSlug);

  return (
    <Link
      href={href}
      className="cart-icon-btn"
      aria-label={
        count > 0
          ? `Warenkorb, ${count} ${count === 1 ? "Artikel" : "Artikel"}`
          : "Warenkorb öffnen"
      }
    >
      <span className="cart-icon-symbol" aria-hidden>
        🛒
      </span>
      {count > 0 ? (
        <span className="cart-icon-badge">{count}</span>
      ) : null}
    </Link>
  );
}
