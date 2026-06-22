import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT_ID = "prj_J9v3BmUkffPHSb1TqGkyJybkhPxD";
const TEAM_ID = "team_aNsi5SXMojcEg7fr2K8rO1bi";
const PROD_URL = "https://web-tawny-ten-78.vercel.app";
const TARGETS = ["production", "preview", "development"];

const authPath = join(
  homedir(),
  "Library/Application Support/com.vercel.cli/auth.json"
);
const { token } = JSON.parse(readFileSync(authPath, "utf8"));
const envPath = new URL("../.env.local", import.meta.url);

function parseEnvFile(content) {
  const entries = [];
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key === "NEXT_PUBLIC_APP_URL") value = PROD_URL;
    entries.push({ key, value });
  }
  return entries;
}

async function api(path, { method = "GET", body } = {}) {
  const url = new URL(path, "https://api.vercel.com");
  url.searchParams.set("teamId", TEAM_ID);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return data;
}

async function main() {
  const entries = parseEnvFile(readFileSync(envPath, "utf8"));
  const existing = await api(`/v10/projects/${PROJECT_ID}/env`);
  const byKey = new Map();

  for (const item of existing.envs ?? []) {
    const list = byKey.get(item.key) ?? [];
    list.push(item);
    byKey.set(item.key, list);
  }

  for (const { key } of entries) {
    for (const item of byKey.get(key) ?? []) {
      await api(`/v9/projects/${PROJECT_ID}/env/${item.id}`, { method: "DELETE" });
    }
  }

  for (const { key, value } of entries) {
    const type = key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted";
    await api(`/v10/projects/${PROJECT_ID}/env`, {
      method: "POST",
      body: { key, value, type, target: TARGETS },
    });
    console.log(`set ${key}`);
  }

  console.log(`done: ${entries.length} variables`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
