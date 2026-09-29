/** OXID shop API (mwv/mapi) — server-side only.
 * Prefers SHOP_API_* env vars; falls back to legacy MERZLJAK_* names.
 */

function envFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getShopApiBaseUrl(): string | null {
  const raw = envFirst("SHOP_API_BASE_URL", "MERZLJAK_API_BASE_URL");
  return raw ? raw.replace(/\/$/, "") : null;
}

export function getShopImageBaseUrl(): string | null {
  const raw =
    envFirst("SHOP_IMAGE_BASE_URL", "MERZLJAK_IMAGE_BASE_URL") ??
    getShopApiBaseUrl();
  return raw ? raw.replace(/\/$/, "") : null;
}

export function getShopApiUsername(): string | null {
  return envFirst("SHOP_API_USERNAME", "MERZLJAK_API_USERNAME") ?? null;
}

export function getShopApiPassword(): string | null {
  const dedicated = process.env.SHOP_API_PASSWORD;
  if (dedicated !== undefined && dedicated !== "") return dedicated;
  const legacy = process.env.MERZLJAK_API_PASSWORD;
  if (legacy !== undefined && legacy !== "") return legacy;
  return null;
}

export function isShopApiConfigured(): boolean {
  return Boolean(
    getShopApiBaseUrl() && getShopApiUsername() && getShopApiPassword()
  );
}
