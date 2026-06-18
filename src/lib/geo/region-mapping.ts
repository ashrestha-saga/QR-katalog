/** Spec §5.3 — region → primary + fallback reseller */
export type RegionRule = {
  /** Display names and aliases (lowercase match) */
  match: string[];
  regionLabel: string;
  primary: string;
  fallback: string;
};

export const REGION_RULES: RegionRule[] = [
  {
    match: ["saarland", "sl"],
    regionLabel: "Saarland",
    primary: "varitec",
    fallback: "promedia",
  },
  {
    match: ["rhineland-palatinate", "rheinland-pfalz", "rp"],
    regionLabel: "Rhineland-Palatinate",
    primary: "varitec",
    fallback: "promedia",
  },
  {
    match: ["baden-württemberg", "baden-wuerttemberg", "baden-wurttemberg", "bw"],
    regionLabel: "Baden-Württemberg",
    primary: "promedia",
    fallback: "varitec",
  },
  {
    match: ["bavaria", "bayern", "by"],
    regionLabel: "Bavaria",
    primary: "promedia",
    fallback: "varitec",
  },
  {
    match: [
      "hamburg",
      "bremen",
      "lower saxony",
      "niedersachsen",
      "schleswig-holstein",
      "hh",
      "hb",
      "ni",
      "sh",
    ],
    regionLabel: "Hamburg, Bremen, Lower Saxony, Schleswig-Holstein",
    primary: "medtec-nord",
    fallback: "varitec",
  },
  {
    match: [
      "north rhine-westphalia",
      "nordrhein-westfalen",
      "nrw",
      "hesse",
      "hessen",
      "he",
      "nw",
    ],
    regionLabel: "NRW, Hesse",
    primary: "varitec",
    fallback: "promedia",
  },
  {
    match: [
      "berlin",
      "brandenburg",
      "mecklenburg-vorpommern",
      "mecklenburg-western pomerania",
      "be",
      "bb",
      "mv",
    ],
    regionLabel: "Berlin, Brandenburg, Mecklenburg-Vorpommern",
    primary: "medtec-nord",
    fallback: "varitec",
  },
  {
    match: [
      "saxony",
      "sachsen",
      "saxony-anhalt",
      "sachsen-anhalt",
      "thuringia",
      "thüringen",
      "thueringen",
      "sn",
      "st",
      "th",
    ],
    regionLabel: "Saxony, Saxony-Anhalt, Thuringia",
    primary: "promedia",
    fallback: "varitec",
  },
];

export type HaendlerRecommendation = {
  region: string;
  primary: string;
  fallback: string;
} | null;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Map a subdivision name or ISO-style code to reseller recommendation.
 */
export function recommendHaendlerForRegion(
  regionInput: string | null | undefined,
  countryCode: string | null | undefined
): HaendlerRecommendation {
  if (!countryCode || countryCode.toUpperCase() !== "DE") {
    return null;
  }
  if (!regionInput?.trim()) {
    return null;
  }

  const key = normalize(regionInput);

  for (const rule of REGION_RULES) {
    if (rule.match.some((m) => key === m || key.includes(m) || m.includes(key))) {
      return {
        region: rule.regionLabel,
        primary: rule.primary,
        fallback: rule.fallback,
      };
    }
  }

  return null;
}

export function toGeoResolution(
  region: string | null,
  countryCode: string | null,
  source: import("./types").GeoSource
): import("./types").GeoResolution {
  const rec = recommendHaendlerForRegion(region, countryCode);

  if (!countryCode) {
    return {
      region: null,
      countryCode: null,
      recommendedHaendler: null,
      fallbackHaendler: null,
      source,
      resolved: false,
    };
  }

  if (countryCode.toUpperCase() !== "DE") {
    return {
      region: region ?? countryCode,
      countryCode: countryCode.toUpperCase(),
      recommendedHaendler: null,
      fallbackHaendler: null,
      source,
      resolved: true,
    };
  }

  if (!rec) {
    return {
      region: region,
      countryCode: "DE",
      recommendedHaendler: null,
      fallbackHaendler: null,
      source,
      resolved: Boolean(region),
    };
  }

  return {
    region: rec.region,
    countryCode: "DE",
    recommendedHaendler: rec.primary,
    fallbackHaendler: rec.fallback,
    source,
    resolved: true,
  };
}
