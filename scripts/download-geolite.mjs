#!/usr/bin/env node
/**
 * Downloads GeoLite2-City.mmdb from MaxMind (requires free license key).
 * Usage: MAXMIND_LICENSE_KEY=xxx node scripts/download-geolite.mjs
 */
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { mkdir, unlink } from "fs/promises";
import { createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(DATA_DIR, "GeoLite2-City.mmdb");

const licenseKey = process.env.MAXMIND_LICENSE_KEY;
if (!licenseKey) {
  console.error(
    "Set MAXMIND_LICENSE_KEY (free at https://www.maxmind.com/en/geolite2/signup)"
  );
  process.exit(1);
}

const url = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${licenseKey}&suffix=tar.gz`;

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  console.log("Downloading GeoLite2-City…");

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Download failed:", res.status, await res.text());
    process.exit(1);
  }

  const tarGz = path.join(DATA_DIR, "GeoLite2-City.tar.gz");
  await pipeline(res.body, createWriteStream(tarGz));

  const { execSync } = await import("child_process");
  execSync(`tar -xzf "${tarGz}" -C "${DATA_DIR}"`, { stdio: "inherit" });

  const { readdirSync, renameSync } = await import("fs");
  const extracted = readdirSync(DATA_DIR).find((n) =>
    n.startsWith("GeoLite2-City_")
  );
  if (!extracted) {
    console.error("Could not find extracted folder");
    process.exit(1);
  }

  const mmdbSrc = path.join(DATA_DIR, extracted, "GeoLite2-City.mmdb");
  if (existsSync(OUT_FILE)) await unlink(OUT_FILE);
  renameSync(mmdbSrc, OUT_FILE);

  execSync(`rm -rf "${path.join(DATA_DIR, extracted)}" "${tarGz}"`);
  console.log("Saved:", OUT_FILE);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
