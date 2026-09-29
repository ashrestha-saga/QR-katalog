import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/** HttpOnly cookie proving the user recently scanned (or re-granted) an article. */
export const SCAN_GRANT_COOKIE = "katalog_scan_grant";

/** Grant lifetime — long enough for configure + cart return trips. */
export const SCAN_GRANT_TTL_SEC = 15 * 60;

const MAX_SKUS_PER_GRANT = 40;

export type ScanGrantPayload = {
  v: 1;
  catalog: string;
  skus: string[];
  exp: number;
};

function getSecret(): string {
  const dedicated = process.env.SCAN_GRANT_SECRET?.trim();
  if (dedicated) return dedicated;
  const shopPassword =
    process.env.SHOP_API_PASSWORD ?? process.env.MERZLJAK_API_PASSWORD;
  if (shopPassword) return shopPassword;
  throw new Error(
    "SCAN_GRANT_SECRET (or SHOP_API_PASSWORD) is required for scan grants"
  );
}

function b64urlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(payloadB64: string): string {
  return b64urlEncode(
    createHmac("sha256", getSecret()).update(payloadB64).digest()
  );
}

export function sealScanGrant(payload: ScanGrantPayload): string {
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function unsealScanGrant(token: string | undefined | null): ScanGrantPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  let expected: string;
  try {
    expected = sign(payloadB64);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const raw = JSON.parse(b64urlDecode(payloadB64).toString("utf8")) as ScanGrantPayload;
    if (raw?.v !== 1 || typeof raw.catalog !== "string" || !Array.isArray(raw.skus)) {
      return null;
    }
    if (typeof raw.exp !== "number" || raw.exp * 1000 <= Date.now()) {
      return null;
    }
    const skus = raw.skus
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!raw.catalog.trim() || skus.length === 0) return null;
    return { v: 1, catalog: raw.catalog.trim(), skus, exp: raw.exp };
  } catch {
    return null;
  }
}

export function grantAllowsSku(
  grant: ScanGrantPayload | null,
  catalogSlug: string,
  sku: string
): boolean {
  if (!grant) return false;
  const want = sku.trim();
  if (!want) return false;
  if (grant.catalog !== catalogSlug.trim()) return false;
  return grant.skus.some((s) => s === want);
}

export function mergeScanGrant(
  existing: ScanGrantPayload | null,
  catalogSlug: string,
  sku: string
): ScanGrantPayload {
  const nextSku = sku.trim();
  const catalog = catalogSlug.trim();
  const nowExp = Math.floor(Date.now() / 1000) + SCAN_GRANT_TTL_SEC;

  if (existing && existing.catalog === catalog) {
    const skus = [nextSku, ...existing.skus.filter((s) => s !== nextSku)].slice(
      0,
      MAX_SKUS_PER_GRANT
    );
    return { v: 1, catalog, skus, exp: nowExp };
  }

  return { v: 1, catalog, skus: [nextSku], exp: nowExp };
}

export async function readScanGrant(): Promise<ScanGrantPayload | null> {
  const jar = await cookies();
  return unsealScanGrant(jar.get(SCAN_GRANT_COOKIE)?.value);
}

export async function writeScanGrant(payload: ScanGrantPayload): Promise<void> {
  const jar = await cookies();
  const maxAge = Math.max(1, payload.exp - Math.floor(Date.now() / 1000));
  jar.set(SCAN_GRANT_COOKIE, sealScanGrant(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function scanGrantCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
