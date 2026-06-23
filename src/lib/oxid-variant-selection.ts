import type { OxidVariantRecord, Product } from "@/lib/mock-data";

export type NormalizedVariant = OxidVariantRecord & {
  values: string[];
};

export function hasVariants(product: Pick<Product, "oxvarname" | "variants">): boolean {
  return (
    Boolean(product.oxvarname?.trim()) &&
    Array.isArray(product.variants) &&
    product.variants.length > 0
  );
}

export function parseVariantLabels(oxvarname: string): string[] {
  return oxvarname
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function normalizeVariants(variants: OxidVariantRecord[]): NormalizedVariant[] {
  return variants
    .map((variant) => {
      const values = variant.oxvarselect
        .split("|")
        .map((value) => value.trim());
      if (!values.some(Boolean)) return null;
      return { ...variant, values };
    })
    .filter((variant): variant is NormalizedVariant => variant !== null);
}

export function buildOptionsByIndex(
  normalizedVariants: NormalizedVariant[]
): Record<number, string[]> {
  const optionsByIndex: Record<number, Set<string>> = {};

  for (const variant of normalizedVariants) {
    variant.values.forEach((value, index) => {
      if (!value) return;
      if (!optionsByIndex[index]) optionsByIndex[index] = new Set();
      optionsByIndex[index].add(value);
    });
  }

  const result: Record<number, string[]> = {};
  for (const [index, values] of Object.entries(optionsByIndex)) {
    result[Number(index)] = [...values];
  }
  return result;
}

export function buildVariantLookup(
  normalizedVariants: NormalizedVariant[]
): Map<string, NormalizedVariant> {
  const lookup = new Map<string, NormalizedVariant>();
  for (const variant of normalizedVariants) {
    lookup.set(JSON.stringify(variant.values), variant);
  }
  return lookup;
}

export function getMatchingVariants(
  normalizedVariants: NormalizedVariant[],
  selectedValues: string[]
): NormalizedVariant[] {
  return normalizedVariants.filter((variant) =>
    selectedValues.every(
      (selectedValue, index) =>
        !selectedValue || variant.values[index] === selectedValue
    )
  );
}

/** Match variants by every selected dimension except one (used for dropdown availability). */
export function getMatchingVariantsExceptIndex(
  normalizedVariants: NormalizedVariant[],
  selectedValues: string[],
  exceptIndex: number
): NormalizedVariant[] {
  return normalizedVariants.filter((variant) =>
    selectedValues.every(
      (selectedValue, index) =>
        index === exceptIndex ||
        !selectedValue ||
        variant.values[index] === selectedValue
    )
  );
}

export function getAvailableOptionsByIndex(
  normalizedVariants: NormalizedVariant[],
  selectedValues: string[],
  dimensionCount: number
): Record<number, Set<string>> {
  const available: Record<number, Set<string>> = {};

  for (let index = 0; index < dimensionCount; index++) {
    const matching = getMatchingVariantsExceptIndex(
      normalizedVariants,
      selectedValues,
      index
    );
    available[index] = new Set(
      matching.map((variant) => variant.values[index]).filter(Boolean)
    );
  }

  return available;
}

export function createEmptySelection(dimensionCount: number): string[] {
  return Array.from({ length: dimensionCount }, () => "");
}

export function isSelectionComplete(selectedValues: string[]): boolean {
  return selectedValues.length > 0 && selectedValues.every(Boolean);
}

export function resolveSelectionChange(
  normalizedVariants: NormalizedVariant[],
  lookup: Map<string, NormalizedVariant>,
  selectedValues: string[],
  changedIndex: number,
  newValue: string,
  dimensionCount: number
): { selectedValues: string[]; selectedVariant: NormalizedVariant | null } {
  const next = [...selectedValues];
  while (next.length < dimensionCount) next.push("");
  next[changedIndex] = newValue;

  if (!isSelectionComplete(next)) {
    return { selectedValues: next, selectedVariant: null };
  }

  const exact = lookup.get(JSON.stringify(next)) ?? null;
  return { selectedValues: next, selectedVariant: exact };
}

export function findVariantByArtnum(
  normalizedVariants: NormalizedVariant[],
  artnum: string
): NormalizedVariant | null {
  return normalizedVariants.find((variant) => variant.oxartnum === artnum) ?? null;
}
