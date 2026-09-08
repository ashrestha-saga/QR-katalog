import {
  extractArticlesFromResponse,
  mapOxidArticleToProduct,
} from "./map-article";
import {
  getMerzljakApiBaseUrl,
  isMerzljakApiConfigured,
} from "./config";
import type { Product } from "@/lib/mock-data";

type TokenCache = {
  token: string;
  expireAt: number;
};

let tokenCache: TokenCache | null = null;

function describeSecret(value: string | undefined): string {
  return value ? `present(length=${value.length})` : "missing";
}

function describeToken(token: string): string {
  return `present(length=${token.length})`;
}

function apiUrl(path: string): string {
  const base = getMerzljakApiBaseUrl();
  if (!base) throw new Error("MERZLJAK_API_BASE_URL is not set");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function login(): Promise<string> {
  const username = process.env.MERZLJAK_API_USERNAME?.trim();
  const password = process.env.MERZLJAK_API_PASSWORD;

  if (!username || !password) {
    throw new Error("MERZLJAK_API_USERNAME and MERZLJAK_API_PASSWORD are required");
  }

  console.info("[merzljak-api] login env", {
    baseUrl: getMerzljakApiBaseUrl() ? "present" : "missing",
    username: describeSecret(username),
    password: describeSecret(password),
  });

  const body = new URLSearchParams({ username, password });

  const res = await fetch(
    apiUrl("/index.php?cl=authapitoken&fnc=login"),
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    }
  );

  const data = (await res.json().catch(() => ({}))) as {
    status?: string;
    token?: string;
    expire_at?: number;
    message?: string;
    error?: string;
  };

  if (!res.ok || !data.token) {
    const msg = data.message ?? data.error ?? `Login failed (${res.status})`;
    console.error("[merzljak-api] login failed", {
      status: res.status,
      responseStatus: data.status,
      message: msg,
      token: data.token ? describeToken(data.token) : "missing",
    });
    throw new Error(msg);
  }

  const expireAt =
    typeof data.expire_at === "number"
      ? data.expire_at * 1000
      : Date.now() + 55 * 60 * 1000;

  tokenCache = { token: data.token, expireAt };
  console.info("[merzljak-api] token generated", {
    status: res.status,
    responseStatus: data.status,
    token: describeToken(data.token),
    expiresAt: new Date(expireAt).toISOString(),
  });
  return data.token;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expireAt > Date.now() + 30_000) {
    console.info("[merzljak-api] using cached token", {
      token: describeToken(tokenCache.token),
      expiresAt: new Date(tokenCache.expireAt).toISOString(),
    });
    return tokenCache.token;
  }
  return login();
}

async function merzljakPost<T>(
  path: string,
  payload: unknown,
  authenticated: boolean
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (authenticated) {
    const token = await getAccessToken();
    console.info("[merzljak-api] using token for request", {
      path,
      token: describeToken(token),
    });
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    status?: string;
    message?: string;
    error?: string;
  };

  console.info("[merzljak-api] response received", {
    path,
    authenticated,
    status: res.status,
    responseStatus: data.status,
    message: data.message,
    error: data.error,
  });

  if (!res.ok) {
    const msg =
      (typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: string }).message)
        : null) ??
      (typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: string }).error)
        : null) ??
      `Merzljak API error (${res.status})`;
    throw new Error(msg);
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    (data as { status?: string }).status === "error"
  ) {
    throw new Error(
      (data as { message?: string }).message ?? "Merzljak API returned error status"
    );
  }

  return data;
}

/** Fetch one or more articles by OXID article number (OXARTNUM / oxartnum). */
export async function fetchArticlesFromMerzljak(
  articleNumbers: string[]
): Promise<Product[]> {
  if (!isMerzljakApiConfigured()) {
    throw new Error("Merzljak API is not configured");
  }

  const numbers = [...new Set(articleNumbers.map((n) => n.trim()).filter(Boolean))];
  if (numbers.length === 0) return [];

  const data = await merzljakPost<unknown>(
    "/index.php?cl=articleapi&fnc=getArticles",
    { oxartnum: numbers },
    true
  );

  const records = extractArticlesFromResponse(data);
  const products: Product[] = [];

  for (const record of records) {
    const product = mapOxidArticleToProduct(record);
    if (product) products.push(product);
  }

  console.info("[merzljak-api] articles mapped", {
    requested: numbers.length,
    records: records.length,
    products: products.length,
  });

  return products;
}

export async function fetchArticleFromMerzljak(sku: string): Promise<Product | null> {
  const products = await fetchArticlesFromMerzljak([sku]);
  return (
    products.find((p) => p.sku === sku) ??
    products[0] ??
    null
  );
}
