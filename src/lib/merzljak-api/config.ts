/** Merzljak OXID shop API (mwv/mapi) — server-side only */
export function getMerzljakApiBaseUrl(): string | null {
  const raw = process.env.MERZLJAK_API_BASE_URL?.trim();
  return raw ? raw.replace(/\/$/, "") : null;
}

export function getMerzljakImageBaseUrl(): string | null {
  const raw =
    process.env.MERZLJAK_IMAGE_BASE_URL?.trim() ?? getMerzljakApiBaseUrl();
  return raw ? raw.replace(/\/$/, "") : null;
}

export function isMerzljakApiConfigured(): boolean {
  return Boolean(
    getMerzljakApiBaseUrl() &&
      process.env.MERZLJAK_API_USERNAME?.trim() &&
      process.env.MERZLJAK_API_PASSWORD
  );
}
