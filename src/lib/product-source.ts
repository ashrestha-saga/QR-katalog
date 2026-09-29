import { fetchArticleFromShopApi } from "@/lib/shop-api/client";
import { isShopApiConfigured } from "@/lib/shop-api/config";
import { type Product } from "@/lib/mock-data";
import { getMockOxidBySku } from "@/lib/shop-basket";

function enrichProductWithOxidId(product: Product): Product {
  if (product.oxidId) return product;
  const oxidId = getMockOxidBySku(product.sku);
  return oxidId ? { ...product, oxidId } : product;
}

/**
 * Resolve article details from the OXID shop API. Products are sourced
 * exclusively from the API in production (no mock fallback).
 */
export async function fetchArticleBySku(sku: string): Promise<Product | null> {
  const trimmed = sku.trim();
  if (!trimmed) return null;

  if (!isShopApiConfigured()) {
    console.error("[product-source] Shop API is not configured");
    return null;
  }

  try {
    const fromApi = await fetchArticleFromShopApi(trimmed);
    return fromApi ? enrichProductWithOxidId(fromApi) : null;
  } catch (error) {
    console.error("[product-source] Shop API:", error);
    return null;
  }
}

export function getProductSourceLabel(): "api" | "none" {
  return isShopApiConfigured() ? "api" : "none";
}
