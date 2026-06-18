import { NextResponse } from "next/server";
import { logGeoLookup } from "@/lib/geo/log-geo";
import {
  regionFromPostalInput,
  resolveFromHeaders,
  resolveFromRegionLabel,
  toGeoResolution,
} from "@/lib/geo/resolve";

export const runtime = "nodejs";

/** GET /api/geo — Geo-IP resolution (internal / same-origin UI) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plz = searchParams.get("plz");
  const geoRegion = searchParams.get("geo_region");
  const debugRegion = request.headers.get("x-debug-region");

  if (plz?.trim()) {
    const region = regionFromPostalInput(plz);
    if (region) {
      const resolution = toGeoResolution(region, "DE", "dev-override");
      logGeoLookup("plz", resolution, { plz: plz.trim() });
      return NextResponse.json(formatResponse(resolution));
    }
    console.info(
      "[geo]",
      JSON.stringify({
        event: "geo_lookup",
        trigger: "plz",
        plz: plz.trim(),
        plz_matched: false,
        note: "no region for plz; trying next resolver",
      })
    );
  }

  if (geoRegion?.trim()) {
    const resolution = resolveFromRegionLabel(geoRegion.trim(), "dev-override");
    logGeoLookup("geo_region", resolution, { geo_region: geoRegion.trim() });
    return NextResponse.json(formatResponse(resolution));
  }

  if (debugRegion?.trim() && process.env.NODE_ENV === "development") {
    const resolution = resolveFromRegionLabel(debugRegion.trim(), "dev-override");
    logGeoLookup("debug_region", resolution, { debug_region: debugRegion.trim() });
    return NextResponse.json(formatResponse(resolution));
  }

  const resolution = await resolveFromHeaders(request.headers, {
    devRegionOverride: null,
  });

  logGeoLookup("headers", resolution, {
    has_cf_country: Boolean(request.headers.get("cf-ipcountry")),
    has_vercel_country: Boolean(request.headers.get("x-vercel-ip-country")),
    used_env_default: resolution.source === "dev-override",
  });

  return NextResponse.json(formatResponse(resolution));
}

function formatResponse(resolution: ReturnType<typeof resolveFromRegionLabel>) {
  return {
    region: resolution.region,
    country_code: resolution.countryCode,
    recommended_haendler: resolution.recommendedHaendler,
    fallback_haendler: resolution.fallbackHaendler,
    resolved: resolution.resolved,
    source: resolution.source,
  };
}
