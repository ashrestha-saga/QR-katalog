import { existsSync } from "fs";
import path from "path";
import type { CityResponse, Reader } from "maxmind";
import { getClientIp, isPrivateOrLocalIp } from "./get-client-ip";
import { toGeoResolution } from "./region-mapping";
import type { GeoResolution, GeoSource } from "./types";

let maxmindReader: Reader<CityResponse> | null | undefined;

function getMmdbPath(): string {
  return (
    process.env.MAXMIND_DB_PATH ??
    path.join(process.cwd(), "data", "GeoLite2-City.mmdb")
  );
}

async function getMaxmindReader(): Promise<Reader<CityResponse> | null> {
  if (maxmindReader !== undefined) return maxmindReader;

  const dbPath = getMmdbPath();
  if (!existsSync(dbPath)) {
    maxmindReader = null;
    return null;
  }

  try {
    const maxmind = await import("maxmind");
    maxmindReader = await maxmind.open<CityResponse>(dbPath);
    return maxmindReader;
  } catch {
    maxmindReader = null;
    return null;
  }
}

function lookupGeoipLite(ip: string): GeoResolution | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const geoip = require("geoip-lite") as {
      lookup: (ip: string) => {
        country?: string;
        region?: string;
      } | null;
    };
    const hit = geoip.lookup(ip);
    if (!hit?.country) return null;

    const subdivision = hit.region ?? null;
    return toGeoResolution(subdivision, hit.country, "geoip-lite");
  } catch {
    return null;
  }
}

async function lookupMaxmind(ip: string): Promise<GeoResolution | null> {
  const reader = await getMaxmindReader();
  if (!reader) return null;

  const result = reader.get(ip);
  if (!result?.country?.iso_code) return null;

  const subdivision =
    result.subdivisions?.[0]?.names?.en ??
    result.subdivisions?.[0]?.iso_code ??
    result.city?.names?.en ??
    null;

  return toGeoResolution(subdivision, result.country.iso_code, "maxmind");
}

function lookupCloudflareHeaders(
  country: string | null,
  region: string | null
): GeoResolution | null {
  if (!country) return null;
  return toGeoResolution(region, country, "cloudflare");
}

function lookupVercelHeaders(
  country: string | null,
  region: string | null
): GeoResolution | null {
  if (!country) return null;
  return toGeoResolution(region, country, "vercel");
}

export async function lookupIp(ip: string): Promise<GeoResolution | null> {
  const maxmindResult = await lookupMaxmind(ip);
  if (maxmindResult?.resolved) return maxmindResult;

  const lite = lookupGeoipLite(ip);
  if (lite?.resolved) return lite;

  if (maxmindResult) return maxmindResult;
  return lite;
}

export async function resolveFromHeaders(
  headers: import("./get-client-ip").HeaderLike,
  options?: { devRegionOverride?: string | null }
): Promise<GeoResolution> {
  if (options?.devRegionOverride) {
    return toGeoResolution(options.devRegionOverride, "DE", "dev-override");
  }

  const cfCountry = headers.get("cf-ipcountry");
  const cfRegion = headers.get("cf-region") ?? headers.get("cf-region-code");
  if (cfCountry && cfCountry !== "XX") {
    const cf = lookupCloudflareHeaders(cfCountry, cfRegion);
    if (cf) return cf;
  }

  const vercelCountry = headers.get("x-vercel-ip-country");
  const vercelRegion =
    headers.get("x-vercel-ip-country-region") ??
    headers.get("x-vercel-ip-city-region");
  if (vercelCountry) {
    const v = lookupVercelHeaders(vercelCountry, vercelRegion);
    if (v) return v;
  }

  const ip = getClientIp(headers);
  if (ip && !isPrivateOrLocalIp(ip)) {
    const fromIp = await lookupIp(ip);
    if (fromIp) return fromIp;
  }

  const devDefault = process.env.DEFAULT_GEO_REGION;
  if (devDefault && (!ip || isPrivateOrLocalIp(ip))) {
    return toGeoResolution(devDefault, "DE", "dev-override");
  }

  return {
    region: null,
    countryCode: null,
    recommendedHaendler: null,
    fallbackHaendler: null,
    source: "unavailable",
    resolved: false,
  };
}

export function resolveFromRegionLabel(
  regionLabel: string,
  source: GeoSource = "dev-override"
): GeoResolution {
  return toGeoResolution(regionLabel, "DE", source);
}
