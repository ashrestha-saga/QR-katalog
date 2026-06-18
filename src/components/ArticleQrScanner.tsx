"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Catalog } from "@/lib/catalog";
import {
  parseArticleSkuFromQr,
  setCatalogSession,
} from "@/lib/catalog-session";
import { CatalogAppShell } from "./CatalogAppShell";

const READER_ID = "article-qr-reader";
const SCAN_COOLDOWN_MS = 2000;

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

  const resolveSku = useCallback((input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    return parseArticleSkuFromQr(trimmed) ?? trimmed;
  }, []);

  const goToConfigure = useCallback(
    (sku: string) => {
      if (processingRef.current) return;

      const now = Date.now();
      if (
        lastScanRef.current?.sku === sku &&
        now - lastScanRef.current.at < SCAN_COOLDOWN_MS
      ) {
        return;
      }
      processingRef.current = true;
      lastScanRef.current = { sku, at: now };

      setCatalogSession(catalog.slug);
      void cleanupScanner().finally(() => {
        processingRef.current = false;
      });
      router.push(`/c/${catalog.slug}/article/${sku}`);
    },
    [catalog.slug, cleanupScanner, router]
  );

  const validateAndGo = useCallback(
    async (sku: string) => {
      if (processingRef.current) return;

      setManualError(null);
      setLookupLoading(true);
      try {
        const res = await fetch(
          `/api/articles/${encodeURIComponent(sku)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          setManualError(
            res.status === 404
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
        setLookupLoading(false);
      }
    },
    [goToConfigure]
  );

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      const sku = resolveSku(decodedText);
      if (!sku) {
        setManualError(
          "Ungültiger Artikel-QR. Erwartet: Artikel-ID oder /p/{id}"
        );
        return;
      }
      void validateAndGo(sku);
    },
    [resolveSku, validateAndGo]
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
    const sku = resolveSku(manualSku);
    if (!sku) {
      setManualError("Bitte Artikelnummer eingeben (z. B. 12345).");
      return;
    }
    void validateAndGo(sku);
  }

  return (
    <CatalogAppShell
      catalog={catalog}
      brandSubtitle="Artikel-QR scannen"
      brandBadge="Scanner"
      footer={
        <Link href={`/c/${catalog.slug}`} className="underline hover:text-secondary">
          Zurück zum Katalog
        </Link>
      }
    >
      <div className="stage-card">
        <p className="step-description">
          Scanne den QR-Code neben dem Produkt. Du siehst die Artikeldetails und
          gibst danach Menge und Bestellung an, bevor du einen weiteren Artikel
          scannen kannst.
        </p>

        <div
          id={READER_ID}
          className={`overflow-hidden rounded-xl border border-mercury bg-black ${
            status === "scanning" ? "min-h-[280px]" : "min-h-0"
          }`}
        />

        {status !== "scanning" && (
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => void startScanner()}
            disabled={status === "starting"}
          >
            {status === "starting" ? "Kamera startet…" : "Kamera öffnen"}
          </button>
        )}

        {status === "scanning" && (
          <button
            type="button"
            className="btn-secondary mt-3"
            onClick={() => void stopScanner()}
          >
            Scanner stoppen
          </button>
        )}

        {cameraError && <p className="geo-warn mt-3">{cameraError}</p>}

        <div className="verteilseite mt-6">
          <p className="text-sm font-medium text-secondary">Manuelle Eingabe (Demo)</p>
          <p className="mt-1 text-xs text-quinary">
            z. B. 12345, 67890, 23456, 34567
          </p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitManual();
            }}
          >
            <input
              type="text"
              value={manualSku}
              onChange={(e) => {
                setManualSku(e.target.value);
                if (manualError) setManualError(null);
              }}
              placeholder="Artikelnummer"
              className="input-field flex-1"
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn-primary btn-inline shrink-0"
              disabled={lookupLoading}
            >
              {lookupLoading ? "Lädt…" : "Konfigurieren"}
            </button>
          </form>
          {manualError && <p className="geo-warn mt-3">{manualError}</p>}
        </div>
      </div>
    </CatalogAppShell>
  );
}
