import { COOKIE_MAX_AGE_DAYS, COOKIE_NAME } from "./mock-data";

export function getHaendlerCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setHaendlerCookie(haendlerId: string): void {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(haendlerId)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

export function clearHaendlerCookie(): void {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/`;
}
