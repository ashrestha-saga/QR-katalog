import { fetchArticleFromMerzljak } from "@/lib/merzljak-api/client";
import { isMerzljakApiConfigured } from "@/lib/merzljak-api/config";
import { type Product } from "@/lib/mock-data";
import { getMockOxidBySku } from "@/lib/shop-basket";

function enrichProductWithOxidId(product: Product): Product {
  if (product.oxidId) return product;
  const oxidId = getMockOxidBySku(product.sku);
  return oxidId ? { ...product, oxidId } : product;
}

/**
 * Resolve article details from the Merzljak shop API. Products are sourced
 * exclusively from the API in production (no mock fallback).
 */
export async function fetchArticleBySku(sku: string): Promise<Product | null> {
  const trimmed = sku.trim();
  if (!trimmed) return null;

  if (!isMerzljakApiConfigured()) {
    console.error("[product-source] Merzljak API is not configured");
    return null;
  }

  try {
    const fromApi = await fetchArticleFromMerzljak(trimmed);
    return fromApi ? enrichProductWithOxidId(fromApi) : null;
  } catch (error) {
    console.error("[product-source] Merzljak API:", error);
    return null;
  }
}

export function getProductSourceLabel(): "api" | "none" {
  return isMerzljakApiConfigured() ? "api" : "none";
}
