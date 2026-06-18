"use client";

import type { Haendler } from "@/lib/mock-data";

type Props = {
  dealers: Haendler[];
  selectedId: string;
  recommendedId: string | null;
  onSelect: (id: string) => void;
};

export function HaendlerGrid({
  dealers,
  selectedId,
  recommendedId,
  onSelect,
}: Props) {
  if (dealers.length === 0) {
    return (
      <p className="text-sm text-quinary">Kein Händler für diese Auswahl verfügbar.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {dealers.map((h) => {
        const isRecommended = h.id === recommendedId;
        const isSelected = h.id === selectedId;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onSelect(h.id)}
            className={`haendler-option ${
              isSelected || isRecommended ? "haendler-option-recommended" : ""
            }`}
          >
            <div className="haendler-icon" aria-hidden>
              🏥
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold text-secondary">{h.name}</div>
              <div
                className={`text-xs ${isRecommended ? "font-medium text-accent-blue" : "text-quinary"}`}
              >
                {h.regionShort}
              </div>
            </div>
            {isRecommended && (
              <>
                <span className="badge-recommended">Empfohlen</span>
                <span className="badge-recommended-mobile md:hidden">Empf.</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
