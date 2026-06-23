"use client";

import Link from "next/link";
import { useCartCount } from "@/hooks/useCartCount";

type Props = {
  catalogSlug: string;
  href: string;
};

export function CartIconButton({ catalogSlug, href }: Props) {
  const count = useCartCount(catalogSlug);

  const label =
    count > 0
      ? `Warenkorb, ${count} ${count === 1 ? "Position" : "Positionen"}`
      : "Warenkorb öffnen";

  return (
    <Link
      href={href}
      className={count > 0 ? "cart-pill-btn" : "cart-icon-btn"}
      aria-label={label}
    >
      <CartIcon />
      {count > 0 ? (
        <>
          <span className="cart-pill-label">
            {count} Pos.
          </span>
          <span className="cart-pill-badge">{count}</span>
        </>
      ) : null}
    </Link>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="17" cy="20" r="1.5" />
      <path d="M2 3h2l2.2 12.3a1 1 0 0 0 1 .8h9.6a1 1 0 0 0 1-.8L21 7H6" />
    </svg>
  );
}
