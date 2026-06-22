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
    <div className="mb-4 space-y-3">
      {labels.map((label, index) => {
        const options = optionsByIndex[index] ?? [];
        const available = availableByIndex[index] ?? new Set(options);
        const selected = selectedValues[index] ?? "";

        return (
          <div key={label}>
            <label
              htmlFor={`variant-select-${index}`}
              className="product-label mb-1.5 block"
            >
              {label}
            </label>
            <select
              id={`variant-select-${index}`}
              className="select-field"
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
