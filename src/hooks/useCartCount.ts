"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CART_UPDATED_EVENT,
  getCartArticleCount,
} from "@/lib/wishlist-session";

export function useCartCount(catalogSlug: string): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    setCount(getCartArticleCount(catalogSlug));
  }, [catalogSlug]);

  useEffect(() => {
    refresh();
    window.addEventListener(CART_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return count;
}
