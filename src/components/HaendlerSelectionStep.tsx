"use client";

import { MOCK_HAENDLER } from "@/lib/mock-data";
import { HaendlerGrid } from "./HaendlerGrid";

type Props = {
  selectedHaendler: string;
  onSelectHaendler: (id: string) => void;
  remember: boolean;
  onRememberChange: (value: boolean) => void;
  onBack: () => void;
  onNext: () => void;
};

/** Phase 1 — pick a dealer without geo/PLZ */
export function HaendlerSelectionStep({
  selectedHaendler,
  onSelectHaendler,
  remember,
  onRememberChange,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="verteilseite">
      <p className="mb-4 text-sm text-quinary">
        Wähle den Händler, bei dem du bestellen möchtest:
      </p>
      <HaendlerGrid
        dealers={MOCK_HAENDLER}
        selectedId={selectedHaendler}
        recommendedId={null}
        onSelect={onSelectHaendler}
      />
      <label className="cookie-section mt-4 cursor-pointer">
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
