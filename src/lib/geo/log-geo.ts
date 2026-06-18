import type { GeoResolution } from "./types";

export type GeoLookupTrigger =
  | "plz"
  | "geo_region"
  | "debug_region"
  | "headers";

/** Structured log for Vercel / local server logs (no IP stored). */
export function logGeoLookup(
  trigger: GeoLookupTrigger,
  resolution: GeoResolution,
  extra?: Record<string, string | boolean | null | undefined>
): void {
  const payload = {
    event: "geo_lookup",
    trigger,
    method: resolution.source,
    resolved: resolution.resolved,
    region: resolution.region,
    country_code: resolution.countryCode,
    recommended_haendler: resolution.recommendedHaendler,
    fallback_haendler: resolution.fallbackHaendler,
    ...extra,
  };

  console.info("[geo]", JSON.stringify(payload));
}
