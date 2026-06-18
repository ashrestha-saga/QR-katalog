export type HeaderLike = {
  get(name: string): string | null;
};

/**
 * Extract client IP from proxy headers. IP is used only for lookup and not stored.
 */
export function getClientIp(headers: HeaderLike): string | null {
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const vercelForwarded = headers.get("x-vercel-forwarded-for");
  if (vercelForwarded) {
    const first = vercelForwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return null;
}

export function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172."))
    return true;
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip === "::ffff:127.0.0.1")
    return true;
  return false;
}
