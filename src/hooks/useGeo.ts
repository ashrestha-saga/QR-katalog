"use client";

import { useCallback, useEffect, useState } from "react";
import { recommendHaendlerForRegion } from "@/lib/geo/region-mapping";

export type GeoApiResponse = {
  region: string | null;
  country_code: string | null;
  recommended_haendler: string | null;
  fallback_haendler: string | null;
  resolved: boolean;
  source: string;
};

export function useGeo(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [geo, setGeo] = useState<GeoApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGeo = useCallback(async (params?: { plz?: string; region?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.plz) qs.set("plz", params.plz);
      if (params?.region) qs.set("geo_region", params.region);
      const url = `/api/geo${qs.toString() ? `?${qs}` : ""}`;
      const res = await fetch(url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Geo lookup failed");
      const data = (await res.json()) as GeoApiResponse;
      setGeo(data);
      return data;
    } catch {
      setError("Could not detect region. Please select manually.");
      setGeo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchGeo();
  }, [enabled, fetchGeo]);

  const applyManualRegion = useCallback((regionLabel: string) => {
    const rec = recommendHaendlerForRegion(regionLabel, "DE");
    const patch: GeoApiResponse = {
      region: rec?.region ?? regionLabel,
      country_code: "DE",
      recommended_haendler: rec?.primary ?? null,
      fallback_haendler: rec?.fallback ?? null,
      resolved: Boolean(rec),
      source: "manual",
    };
    setGeo(patch);
    return patch;
  }, []);

  return { geo, loading, error, fetchGeo, applyManualRegion };
}
