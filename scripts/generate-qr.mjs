#!/usr/bin/env node
/**
 * Generate catalog cover + article QR codes (PNG + SVG).
 *
 * - Cover QR: full URL → company landing `/c/{catalogSlug}`
 * - Article QR: article id only (scanned in-app → `/p/{id}` on same domain)
 *
 * Configuration (CLI args override env):
 *   arg 1 / NEXT_PUBLIC_APP_URL      base URL of the deployment (required)
 *   arg 2 / NEXT_PUBLIC_CATALOG_SLUG catalog slug (default: "catalog")
 *   arg 3 / QR_SKUS                  comma-separated article SKUs (required)
 *   QR_DARK_COLOR                    foreground color (default: #195084)
 *
 * Example:
 *   NEXT_PUBLIC_APP_URL=https://shop.example.com \
 *   NEXT_PUBLIC_CATALOG_SLUG=example QR_SKUS=12345,67890 \
 *   node scripts/generate-qr.mjs
 */
import { mkdir, readdir, rm, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "qr");

const baseUrl = (process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "").replace(
  /\/$/,
  ""
);
const catalogSlug =
  process.argv[3] || process.env.NEXT_PUBLIC_CATALOG_SLUG || "catalog";
const darkColor = process.env.QR_DARK_COLOR || "#195084";

const skus = (process.argv[4] || process.env.QR_SKUS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

if (!baseUrl) {
  console.error(
    "Usage: node scripts/generate-qr.mjs <base-url> [catalog-slug] [sku,sku,...]"
  );
  console.error("  base-url required (or set NEXT_PUBLIC_APP_URL)");
  process.exit(1);
}

if (skus.length === 0) {
  console.error("No SKUs provided. Pass them as arg 3 or set QR_SKUS=12345,67890");
  process.exit(1);
}

/** Remove all files in public/qr (old PNG/SVG/manifest) before regenerating */
async function cleanQrDir() {
  await mkdir(OUT_DIR, { recursive: true });
  const entries = await readdir(OUT_DIR, { withFileTypes: true });
  await Promise.all(
    entries.map((e) => rm(path.join(OUT_DIR, e.name), { recursive: true, force: true }))
  );
  console.log("Cleared public/qr/\n");
}

async function generateQr(QRCode, url, baseName) {
  await QRCode.toFile(path.join(OUT_DIR, `${baseName}.png`), url, {
    errorCorrectionLevel: "Q",
    margin: 2,
    width: 512,
    color: { dark: darkColor, light: "#ffffff" },
  });
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 2,
  });
  await writeFile(path.join(OUT_DIR, `${baseName}.svg`), svg);
}

async function main() {
  const QRCode = (await import("qrcode")).default;
  await cleanQrDir();
  await mkdir(OUT_DIR, { recursive: true });

  const catalogUrl = `${baseUrl}/c/${catalogSlug}`;
  const catalogBase = `catalog-${catalogSlug}`;

  console.log("=== Catalog cover (front page) ===");
  await generateQr(QRCode, catalogUrl, catalogBase);
  console.log(`  URL: ${catalogUrl}`);
  console.log(`  PNG: public/qr/${catalogBase}.png\n`);

  console.log("=== Article QRs (inside catalog) — article id only ===");
  for (const sku of skus) {
    const baseName = `product-${sku}`;
    await generateQr(QRCode, sku, baseName);
    console.log(`SKU ${sku}`);
    console.log(`  QR payload: ${sku}`);
    console.log(`  Routes on scan host: /p/${sku}`);
    console.log(`  PNG: public/qr/${baseName}.png\n`);
  }

  const manifest = {
    baseUrl,
    catalogSlug,
    generatedAt: new Date().toISOString(),
    catalog: {
      slug: catalogSlug,
      label: "Catalog cover (front page)",
      url: catalogUrl,
      png: `/qr/${catalogBase}.png`,
      svg: `/qr/${catalogBase}.svg`,
    },
    products: skus.map((sku) => ({
      sku,
      payload: sku,
      routePath: `/p/${sku}`,
      png: `/qr/product-${sku}.png`,
      svg: `/qr/product-${sku}.svg`,
    })),
  };
  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log("Manifest: public/qr/manifest.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
