export type GeoSource =
  | "maxmind"
  | "geoip-lite"
  | "cloudflare"
  | "vercel"
  | "dev-override"
  | "unavailable";

export type GeoResolution = {
  region: string | null;
  countryCode: string | null;
  recommendedHaendler: string | null;
  fallbackHaendler: string | null;
  source: GeoSource;
  /** True when region was resolved; false → manual selection only */
  resolved: boolean;
};
