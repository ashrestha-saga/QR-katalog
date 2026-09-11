/**
 * Client helper: mint / extend a scan grant for a SKU (sets HttpOnly cookie).
 * Returns the product when the shop lookup succeeds.
 */
export async function requestScanGrant(
  catalogSlug: string,
  sku: string
): Promise<
  | { ok: true; product: unknown }
  | { ok: false; status: number; error: string }
> {
  const res = await fetch("/api/scan/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    cache: "no-store",
    body: JSON.stringify({ catalogSlug, sku }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    product?: unknown;
    error?: string;
  };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.error ?? "grant_failed",
    };
  }

  return { ok: true, product: data.product };
}
