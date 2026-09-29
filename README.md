# Catalog QR Routing

Mobile-first web app for **catalog → QR → shop** ordering. A print catalog carries
two kinds of QR codes:

1. **Cover QR** → opens the company landing page (`/c/{slug}` or `/`).
2. **Article QR** (article id only) → scanned in-app, opens `/p/{id}`, where the
   shopper configures quantity and is forwarded to the shop basket.

Article data comes exclusively from the **OXID shop API**. Each company is
deployed as its own instance and configured entirely through environment variables.

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local   # then fill in per-company values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm run start
```

If you see `Cannot find module './331.js'` (or similar), the `.next` folder is stale:

```bash
rm -rf .next && npm run build && npm run start
```

## Configuration (environment variables)

All configuration lives in `.env.local` — see `.env.example` for the full list. Key
variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Public site URL (QR generation, absolute links) |
| `NEXT_PUBLIC_CATALOG_SLUG` | Catalog slug used in `/c/{slug}` routes |
| `CATALOG_TITLE`, `CATALOG_EDITION`, `CATALOG_TAGLINE` | Catalog landing metadata |
| `NEXT_PUBLIC_CATALOG_FORWARD_URL` | Order forwarding endpoint |
| `NEXT_PUBLIC_SHOP_BASE_URL` | OXID shop root for basket redirect |
| `SHOP_API_BASE_URL` / `_USERNAME` / `_PASSWORD` | Shop API (product source) |
| `SHOP_IMAGE_BASE_URL` | Product image host (defaults to API base) |
| `COMPANY_*` | Footer + page metadata |
| `THEME_COLOR_*` | Brand palette (see `src/lib/theme.ts`) |

## Routes

| URL | Purpose |
|-----|---------|
| `/` | Catalog landing (configured catalog) |
| `/c/{slug}` | Catalog landing (cover QR target) |
| `/c/{slug}/scan` | In-app article QR scanner |
| `/c/{slug}/article/{sku}` | Article configure (qty) |
| `/c/{slug}/cart` | Warenkorb (editable overview) |
| `/p/{id}` | Article landing after scanning an article QR |
| `/api/articles/{sku}` | Article details from the shop API |
| `/api/basket` | Cart lines → OXID `addtoCart` redirect |

**Checkout:** `POST /api/basket` builds an OXID `addtoCart` URL, e.g.
`{SHOP_BASE}/index.php?cl=basket&fnc=addToCart&aproducts[{oxidId}][am]={qty}&…`.
Each line needs an `oxidId` from the shop article API (or `MOCK_OXID_BY_SKU` in dev).

> Reseller (Händler) routing and Geo-IP steps exist but are **dormant** — toggled via
> `WIZARD_HAENDLER_STEP_ENABLED` / `WIZARD_GEO_STEP_ENABLED` in `src/lib/wizard-config.ts`.

## Generate QR codes

Generates the catalog cover QR plus one article QR per SKU (clears `public/qr/` first):

```bash
NEXT_PUBLIC_APP_URL=https://shop.example.com \
NEXT_PUBLIC_CATALOG_SLUG=example \
QR_SKUS=12345,67890 \
npm run qr:generate
```

Or pass them as args: `npm run qr:generate -- https://shop.example.com example 12345,67890`.
Delete generated assets only: `npm run qr:clean`. The `QR_DARK_COLOR` env sets the QR
foreground color (default `#195084`).

## Branding

Per-company logo files live in `public/logo/`. Swap them when deploying for a new company.
