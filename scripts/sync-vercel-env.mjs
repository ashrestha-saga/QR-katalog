#!/usr/bin/env node
/**
 * Sync .env.local → Vercel production environment variables.
 * Usage: node scripts/sync-vercel-env.mjs [production-url]
 */
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");
const prodUrl =
  process.argv[2] ||
  process.env.VERCEL_PRODUCTION_URL ||
  "https://web-tawny-ten-78.vercel.app";

function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key) vars[key] = value;
  }
  return vars;
}

function addEnv(key, value) {
  const result = spawnSync(
    "npx",
    ["vercel@latest", "env", "add", key, "production", "--yes", "--force"],
    {
      cwd: root,
      input: value,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );
  return result.status === 0;
}

const vars = parseEnvFile(readFileSync(envPath, "utf-8"));
vars.NEXT_PUBLIC_APP_URL = prodUrl.replace(/\/$/, "");

let ok = 0;
let fail = 0;
for (const [key, value] of Object.entries(vars)) {
  if (addEnv(key, value)) {
    console.log(`✓ ${key}`);
    ok++;
  } else {
    console.log(`✗ ${key}`);
    fail++;
  }
}

console.log(`\nDone: ${ok} ok, ${fail} failed`);
console.log(`NEXT_PUBLIC_APP_URL = ${vars.NEXT_PUBLIC_APP_URL}`);
