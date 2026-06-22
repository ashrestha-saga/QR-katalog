"use client";

import type { VariantSelectionState } from "@/hooks/useVariantSelection";

type Props = Pick<
  VariantSelectionState,
  | "labels"
  | "selectedValues"
  | "optionsByIndex"
  | "availableByIndex"
  | "onSelectValue"
>;

export function VariantSelector({
  labels,
  selectedValues,
  optionsByIndex,
  availableByIndex,
  onSelectValue,
}: Props) {
  return (
    <div className="article-variant-fields">
      {labels.map((label, index) => {
        const options = optionsByIndex[index] ?? [];
        const available = availableByIndex[index] ?? new Set(options);
        const selected = selectedValues[index] ?? "";

        return (
          <div key={label} className="article-variant-field">
            <label
              htmlFor={`variant-select-${index}`}
              className="article-variant-label"
            >
              {label}
            </label>
            <select
              id={`variant-select-${index}`}
              className="select-field article-variant-select"
              value={selected}
              onChange={(event) => onSelectValue(index, event.target.value)}
            >
              <option value="">— Bitte wählen —</option>
              {options.map((option) => {
                const isDisabled = !available.has(option);
                return (
                  <option key={option} value={option} disabled={isDisabled}>
                    {option}
                    {isDisabled ? " (nicht verfügbar)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        );
      })}
    </div>
  );
}
