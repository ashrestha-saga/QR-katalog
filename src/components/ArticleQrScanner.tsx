"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import {
  markArticleScanned,
  parseScannedArticleQr,
  setCatalogSession,
} from "@/lib/catalog-session";
import { requestScanGrant } from "@/lib/request-scan-grant";
import { CatalogAppShell } from "./CatalogAppShell";

const READER_ID = "article-qr-reader";
const SCAN_COOLDOWN_MS = 2000;
const EXAMPLE_SKUS = ["VA-170520", "12345", "67890"];

type ScanStatus = "idle" | "starting" | "scanning";

type Props = {
  catalog: Catalog;
};

export function ArticleQrScanner({ catalog }: Props) {
  const router = useRouter();
  const scannerRef = useRef<InstanceType<
    Awaited<typeof import("html5-qrcode")>["Html5Qrcode"]
  > | null>(null);
  const lastScanRef = useRef<{ sku: string; at: number } | null>(null);
  const processingRef = useRef(false);
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSku, setManualSku] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const catalogLabel = catalog.edition
    ? `${catalog.title} · Edition ${catalog.edition}`
    : catalog.title;

  const clearReaderElement = useCallback(() => {
    const el = document.getElementById(READER_ID);
    if (el) el.innerHTML = "";
  }, []);

  const cleanupScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      clearReaderElement();
      return;
    }
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      /* scanner may never have started */
    }
    try {
      await scanner.clear();
    } catch {
      /* ignore */
    }
    clearReaderElement();
  }, [clearReaderElement]);

  const resolveScanInput = useCallback(
    (input: string): string | null => {
      const parsed = parseScannedArticleQr(input, catalog.slug);
      switch (parsed.kind) {
        case "sku":
          setManualError(null);
          return parsed.sku;
        case "foreign_url":
          setManualError(
            "Dieser QR gehört nicht zu unserem Katalog (falsche Domain)."
          );
          return null;
        case "wrong_catalog":
          setManualError(
            `Dieser QR gehört zu einem anderen Katalog (${parsed.scannedSlug}).`
          );
          return null;
        case "invalid":
        default:
          setManualError(
            "Ungültiger Artikel-QR. Erwartet: Artikelnummer oder Link zu /c/…/article/…"
          );
          return null;
      }
    },
    [catalog.slug]
  );

  const goToConfigure = useCallback(
    (sku: string) => {
      const now = Date.now();
      if (
        lastScanRef.current?.sku === sku &&
        now - lastScanRef.current.at < SCAN_COOLDOWN_MS
      ) {
        return;
      }
      lastScanRef.current = { sku, at: now };

      setCatalogSession(catalog.slug);
      markArticleScanned(sku);
      void cleanupScanner();
      router.push(`/c/${catalog.slug}/article/${encodeURIComponent(sku)}`);
    },
    [catalog.slug, cleanupScanner, router]
  );

  const validateAndGo = useCallback(
    async (sku: string) => {
      if (processingRef.current) return;

      setManualError(null);
      setLookupLoading(true);
      processingRef.current = true;
      try {
        const result = await requestScanGrant(catalog.slug, sku);
        if (!result.ok) {
          setManualError(
            result.status === 404
              ? `Artikel ${sku} wurde im Shop nicht gefunden.`
              : "Artikel konnte nicht geladen werden. Bitte erneut versuchen."
          );
          return;
        }
        goToConfigure(sku);
      } catch {
        setManualError(
          "Verbindung zum Shop fehlgeschlagen. Bitte erneut versuchen."
        );
      } finally {
        processingRef.current = false;
        setLookupLoading(false);
      }
    },
    [catalog.slug, goToConfigure]
  );

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const sku = resolveScanInput(decodedText);
      if (!sku) return;
      void validateAndGo(sku);
    },
    [resolveScanInput, validateAndGo]
  );

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setManualError(null);
    setStatus("starting");

    await cleanupScanner();

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(READER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (text) => handleScanSuccess(text),
        () => {}
      );
      setStatus("scanning");
    } catch {
      scannerRef.current = null;
      clearReaderElement();
      setStatus("idle");
      setCameraError(
        "Kamera auf diesem Gerät nicht verfügbar (z. B. Desktop ohne Webcam). Bitte Artikelnummer manuell eingeben."
      );
    }
  }, [cleanupScanner, clearReaderElement, handleScanSuccess]);

  const stopScanner = useCallback(async () => {
    await cleanupScanner();
    setStatus("idle");
  }, [cleanupScanner]);

  useEffect(() => {
    setCatalogSession(catalog.slug);
    return () => {
      void cleanupScanner();
    };
  }, [catalog.slug, cleanupScanner]);

  function submitManual() {
    if (!manualSku.trim()) {
      setManualError("Bitte Artikelnummer eingeben (z. B. 12345).");
      return;
    }
    const sku = resolveScanInput(manualSku);
    if (!sku) return;
    void validateAndGo(sku);
  }

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle=""
      brandBadge=""
      unifiedCard
    >
      <div className="scan-page">
        <p className="scan-catalog-label">{catalogLabel}</p>
        <h1 className="scan-page-title">Artikel aus dem Katalog laden</h1>
        <p className="scan-page-description">
          Scanne den QR-Code neben dem Produkt – oder gib die Bestellnummer
          direkt ein. Beide Wege führen zu denselben Artikeldetails.
        </p>

        <div className="scan-options">
          <section className="scan-option-card scan-option-card-qr" aria-label="QR-Code scannen">
            <div className="scan-option-header">
              <div className="scan-option-icon" aria-hidden>
                <QrCodeIcon />
              </div>
              <div className="min-w-0">
                <h2 className="scan-option-title">QR-Code scannen</h2>
                <p className="scan-option-subtitle">
                  Empfohlen – Artikel-QR direkt aus dem Printkatalog erfassen.
                </p>
              </div>
            </div>

            <div
              id={READER_ID}
              className={`scan-reader ${
                status === "scanning" ? "scan-reader-active" : ""
              }`}
            />

            {status !== "scanning" ? (
              <button
                type="button"
                className="btn-primary scan-camera-btn"
                onClick={() => void startScanner()}
                disabled={status === "starting"}
              >
                <CameraIcon />
                {status === "starting" ? "Kamera startet…" : "Kamera öffnen"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void stopScanner()}
              >
                Scanner stoppen
              </button>
            )}

            {cameraError ? <p className="geo-warn mt-3">{cameraError}</p> : null}
          </section>

          <div className="scan-options-divider" aria-hidden>
            <span>oder</span>
          </div>

          <section
            className="scan-option-card scan-option-card-manual"
            aria-label="Bestellnummer eingeben"
          >
            <div className="scan-option-header">
              <div className="scan-option-icon" aria-hidden>
                <ArticleListIcon />
              </div>
              <div className="min-w-0">
                <h2 className="scan-option-title">Bestellnummer eingeben</h2>
                <p className="scan-option-subtitle">
                  Du kennst die Artikel-Nr.? Direkt eintippen – ohne Scan.
                </p>
              </div>
            </div>

            <form
              className="scan-manual-form"
              onSubmit={(e) => {
                e.preventDefault();
                submitManual();
              }}
            >
              <label className="scan-manual-label" htmlFor="manual-sku">
                Artikelnummer
              </label>
              <div className="scan-manual-row">
                <input
                  id="manual-sku"
                  type="text"
                  value={manualSku}
                  onChange={(e) => {
                    setManualSku(e.target.value);
                    if (manualError) setManualError(null);
                  }}
                  placeholder="z. B. VA-170520"
                  className="input-field"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="btn-primary btn-inline scan-submit-btn"
                  disabled={lookupLoading}
                >
                  {lookupLoading ? "Lädt…" : "Anzeigen"}
                </button>
              </div>
            </form>

            <div className="scan-examples">
              <span className="scan-examples-label">Beispiele:</span>
              <div className="scan-example-pills">
                {EXAMPLE_SKUS.map((sku) => (
                  <button
                    key={sku}
                    type="button"
                    className="scan-example-pill"
                    onClick={() => {
                      setManualSku(sku);
                      if (manualError) setManualError(null);
                    }}
                  >
                    {sku}
                  </button>
                ))}
              </div>
            </div>

            {manualError ? <p className="geo-warn mt-3">{manualError}</p> : null}
          </section>
        </div>

        <div className="scan-info-bar">
          <InfoIcon />
          <p>
            QR beschädigt oder nicht lesbar? Nutze einfach die Bestellnummer aus
            dem Katalog – das Ergebnis ist identisch.
          </p>
        </div>
      </div>
    </CatalogAppShell>
  );
}

function QrCodeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h2v2h-2v-2zm-3 0h3v2h-3v-2zm3 3h2v2h-2v-2zm-3 0h3v3h-3v-3z" />
    </svg>
  );
}

function ArticleListIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </svg>
  );
}
