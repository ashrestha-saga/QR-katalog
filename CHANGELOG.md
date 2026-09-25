# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Catalog article flow is a single configure page: variant + quantity, then “In Warenkorb speichern” goes straight to the cart (Bestellung and Weiterleitung steps removed).
- Move Germany shipping (Versand) into the cart summary, with net tiers (≤€30 → €12.90, ≤€100 → €7.90, >€100 → free).
- Merzljak `getArticles` request body key: `articles` → `oxartnum`.
- Non-variant Konfiguration on step 1 uses `oxshortdesc` (`shortDescription`) instead of `variant` / `unitName` / “Standardausführung”.

### Added

- Scanner accepts full article URLs `{APP_URL}/c/{catalogSlug}/article/{sku}`: validates origin and catalog slug, extracts the SKU, then mints the scan grant (bare article numbers still work; foreign/wrong-catalog URLs are rejected).
- Scan-grant cookie: article pages and `/api/articles` require a short-lived signed grant minted after scan (`POST /api/scan/grant`); direct `/article/{sku}` URLs redirect to `/c/{slug}/scan`.
- Toast on the cart after adding an item (“Artikel hinzugefügt”), shown at the top of the page.
- Step-1 Stückpreis UVP from OXID `oxtprice`: struck-through list price when higher than the sale price.
- Faint `VE:` packaging hint beside Menge when `oxunitname` includes a quantity (e.g. `100 Stück`).

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
