# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Inquiry catalog mode (`NEXT_PUBLIC_CATALOG_ORDER_MODE=inquiry`): scan-only article entry (no manual Bestellnummer), no Warenkorb route or cart icon, and inquiry-specific landing copy and steps.
- Scan-grant cookie: article pages and `/api/articles` require a short-lived signed grant minted after scan (`POST /api/scan/grant`); direct `/article/{sku}` URLs redirect to `/c/{slug}/scan`.
- Toast on the cart after adding an item (“Artikel hinzugefügt”), shown at the top of the page.
- `.DS_Store` entries to `.gitignore`.
- Step-1 Stückpreis UVP from OXID `oxtprice`: struck-through list price when higher than the sale price.
- Faint `VE:` packaging hint beside Menge when `oxunitname` includes a quantity (e.g. `100 Stück`).

### Changed

- Merzljak `getArticles` request body key: `articles` → `oxartnum`.
- Non-variant Konfiguration on step 1 uses `oxshortdesc` (`shortDescription`) instead of `variant` / `unitName` / “Standardausführung”.
- Skip the post-save “Weiterleitung” step: saving from the order step goes straight to the Warenkorb.
- Move Germany shipping (Versand) from the article order step into the cart summary, with net tiers (≤€30 → €12.90, ≤€100 → €7.90, >€100 → free).
- `/c/{slug}/cart` and legacy `/c/{slug}/review` redirect to catalog landing when inquiry mode is active.
- `CatalogAppShell` hides the header cart icon in inquiry mode.
- `ArticleQrScanner` shows camera scan only in inquiry mode (manual SKU entry and fallback info bar remain in shop mode).
- `CatalogLanding` uses inquiry-specific steps and description when inquiry mode is active.
- `ArticleConfigure` skips cart duplicate warning and cart save callback in inquiry mode.

### Fixed

- `POST /api/basket` import: use `getOrderMode` from `@/lib/order-mode` (build was failing on missing `getOrderModeFromRequest`).

### Removed

- Unused `OrderModeProvider` (referenced missing `demo-order-mode` / `resolveOrderMode` modules).
- macOS `.DS_Store` files from the workspace.

## [1.0.0] - 2026-06-23

First stable release of the catalog QR routing web app.

### Added

- Catalog landing page (`/` and `/c/{slug}`) with cover QR entry point.
- In-app article QR scanner (`/c/{slug}/scan`) with manual SKU fallback.
- Two-step article configure flow: variant selection and order summary (`/c/{slug}/article/{sku}`).
- Variant selection with live preview, configuration info card (Konfiguration, Artikelnummer, optional PZN, Stückpreis), and quantity controls.
- Warenkorb with editable line items, pricing summary, and checkout handoff (`/c/{slug}/cart`).
- Article landing route for direct article QR codes (`/p/{id}`).
- Merzljak OXID shop API integration for product data, images, variants, and stock.
- Shop checkout forwarding via OXID `addtoCart` basket URL (`POST /api/basket`).
- Email order inquiry flow with SMTP when shop checkout URLs are not configured.
- Per-deployment configuration via environment variables (catalog, company, theme, API, SMTP).
- Env-driven theme palette and semantic color tokens (`THEME_COLOR_*`).
- Global site footer with company contact and legal links.
- QR code generation scripts for catalog cover and article codes (`npm run qr:generate`).
- Product detail modal with short and long descriptions.
- Dormant reseller (Händler) and Geo-IP wizard steps (disabled by default).

### Changed

- Product titles in cards use `text-secondary` for improved readability.
- Description text uses env-configured black (`THEME_COLOR_BLACK`, default `#212529`).
- Privacy notices (Datenschutzhinweis) are justified in cart and inquiry modal.
