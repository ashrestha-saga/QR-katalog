"use client";

import type { GeoApiResponse } from "@/hooks/useGeo";
import { MOCK_HAENDLER, getHaendler } from "@/lib/mock-data";
import { HaendlerGrid } from "./HaendlerGrid";

export type GeoSelectionTab = "geo" | "plz" | "all";

type Props = {
  selectionTab: GeoSelectionTab;
  onSelectionTabChange: (tab: GeoSelectionTab) => void;
  geo: GeoApiResponse | null;
  geoLoading: boolean;
  geoError: string | null;
  recommendedId: string | null;
  selectedHaendler: string;
  onSelectHaendler: (id: string) => void;
  plz: string;
  onPlzChange: (value: string) => void;
  plzSearched: boolean;
  onSearchPlz: () => void;
  remember: boolean;
  onRememberChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
};

/**
 * Phase 2 — geo-IP, PLZ, and region-based dealer recommendation.
 * Not shown when WIZARD_GEO_STEP_ENABLED is false.
 */
export function GeoHaendlerStep({
  selectionTab,
  onSelectionTabChange,
  geo,
  geoLoading,
  geoError,
  recommendedId,
  selectedHaendler,
  onSelectHaendler,
  plz,
  onPlzChange,
  plzSearched,
  onSearchPlz,
  remember,
  onRememberChange,
  onBack,
  onNext,
}: Props) {
  const recommended = recommendedId ? getHaendler(recommendedId) : null;
  const geoTabDealers = recommended
    ? MOCK_HAENDLER.filter((h) => h.id === recommended.id)
    : MOCK_HAENDLER;

  return (
    <div className="verteilseite">
      <div className="selection-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={selectionTab === "geo"}
          className={`selection-tab ${selectionTab === "geo" ? "selection-tab-active" : ""}`}
          onClick={() => onSelectionTabChange("geo")}
        >
          <span className="md:hidden">📍 Auto</span>
          <span className="hidden md:inline">📍 Automatisch (Geo-IP)</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectionTab === "plz"}
          className={`selection-tab ${selectionTab === "plz" ? "selection-tab-active" : ""}`}
          onClick={() => onSelectionTabChange("plz")}
        >
          <span className="md:hidden">🔍 PLZ</span>
          <span className="hidden md:inline">🔍 PLZ-Suche</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectionTab === "all"}
          className={`selection-tab ${selectionTab === "all" ? "selection-tab-active" : ""}`}
          onClick={() => onSelectionTabChange("all")}
        >
          <span className="md:hidden">📋 Alle</span>
          <span className="hidden md:inline">📋 Alle Händler</span>
        </button>
      </div>

      {selectionTab === "geo" && (
        <div role="tabpanel">
          {geoLoading && (
            <p className="mb-4 text-sm text-quinary">Region wird erkannt…</p>
          )}

          {!geoLoading && geo?.resolved && geo.region && (
            <div className="geo-detected">
              <span aria-hidden>📍</span>
              <span>
                <span className="md:hidden">
                  <strong>{geo.region}</strong> erkannt
                </span>
                <span className="hidden md:inline">
                  Region erkannt: <strong>{geo.region}</strong>
                  {recommended
                    ? " — empfohlener Händler in deiner Nähe"
                    : " — bitte Händler wählen"}
                </span>
                {geo.source && (
                  <span className="mt-1 hidden text-xs opacity-80 md:block">
                    via {geo.source}
                  </span>
                )}
              </span>
            </div>
          )}

          {!geoLoading && !geo?.resolved && (
            <div className="geo-warn mb-4">
              {geoError ??
                "Region konnte nicht erkannt werden. Nutze PLZ-Suche oder „Alle Händler“."}
            </div>
          )}

          <HaendlerGrid
            dealers={geoTabDealers}
            selectedId={selectedHaendler}
            recommendedId={recommendedId}
            onSelect={onSelectHaendler}
          />
        </div>
      )}

      {selectionTab === "plz" && (
        <div role="tabpanel">
          <p className="mb-3 text-sm text-quinary">
            Gib deine PLZ ein, um den nächsten Händler zu finden:
          </p>
          <div className="plz-search">
            <input
              type="text"
              inputMode="numeric"
              className="input-field flex-1"
              placeholder="PLZ eingeben (z. B. 66589)"
              maxLength={5}
              value={plz}
              onChange={(e) => onPlzChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchPlz();
              }}
            />
            <button
              type="button"
              className="btn-primary btn-inline shrink-0"
              onClick={onSearchPlz}
            >
              Suchen
            </button>
          </div>
          {plzSearched && geo?.region && (
            <div className="geo-detected">
              <span aria-hidden>📍</span>
              <span>
                PLZ <strong>{plz.trim()}</strong> → Region{" "}
                <strong>{geo.region}</strong>
              </span>
            </div>
          )}
          {plzSearched ? (
            <HaendlerGrid
              dealers={MOCK_HAENDLER}
              selectedId={selectedHaendler}
              recommendedId={recommendedId}
              onSelect={onSelectHaendler}
            />
          ) : (
            <p className="text-sm text-quinary">PLZ eingeben und „Suchen“ tippen.</p>
          )}
        </div>
      )}

      {selectionTab === "all" && (
        <div role="tabpanel">
          <p className="mb-4 text-sm text-quinary">Alle verfügbaren Händler:</p>
          <HaendlerGrid
            dealers={MOCK_HAENDLER}
            selectedId={selectedHaendler}
            recommendedId={recommendedId}
            onSelect={onSelectHaendler}
          />
        </div>
      )}

      <label className="cookie-section cursor-pointer">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => onRememberChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-mercury"
        />
        <span>
          Diesen Händler für künftige QR-Scans merken (Cookie, 90 Tage)
        </span>
      </label>

      <div className="nav-buttons">
        <button type="button" className="btn-secondary nav-btn-back" onClick={onBack}>
          <span className="md:hidden">←</span>
          <span className="hidden md:inline">← Zurück</span>
        </button>
        <button type="button" className="btn-primary md:flex-1" onClick={onNext}>
          <span className="md:hidden">Weiter →</span>
          <span className="hidden md:inline">Weiter zur Bestellung →</span>
        </button>
      </div>
    </div>
  );
}
