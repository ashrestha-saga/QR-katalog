"use client";

import { useCallback, useMemo, useState } from "react";
import type { Product } from "@/lib/mock-data";
import { mapVariantToDisplayProduct } from "@/lib/map-variant-to-product";
import {
  buildOptionsByIndex,
  buildVariantLookup,
  createEmptySelection,
  findVariantByArtnum,
  getAvailableOptionsByIndex,
  hasVariants,
  isSelectionComplete,
  normalizeVariants,
  parseVariantLabels,
  resolveSelectionChange,
  type NormalizedVariant,
} from "@/lib/oxid-variant-selection";

type Options = {
  /** Restore a previously selected variant by its article number */
  initialVariantArtnum?: string;
};

export type VariantSelectionState = {
  hasVariants: boolean;
  labels: string[];
  selectedValues: string[];
  selectedVariant: NormalizedVariant | null;
  isVariantSelectionComplete: boolean;
  displayProduct: Product;
  optionsByIndex: Record<number, string[]>;
  availableByIndex: Record<number, Set<string>>;
  onSelectValue: (index: number, value: string) => void;
};

export function useVariantSelection(
  product: Product,
  options: Options = {}
): VariantSelectionState {
  const configurable = hasVariants(product);
  const labels = useMemo(
    () => (product.oxvarname ? parseVariantLabels(product.oxvarname) : []),
    [product.oxvarname]
  );

  const normalizedVariants = useMemo(
    () => (product.variants ? normalizeVariants(product.variants) : []),
    [product.variants]
  );

  const lookup = useMemo(
    () => buildVariantLookup(normalizedVariants),
    [normalizedVariants]
  );

  const optionsByIndex = useMemo(
    () => buildOptionsByIndex(normalizedVariants),
    [normalizedVariants]
  );

  const restoredVariant = useMemo(
    () =>
      configurable && options.initialVariantArtnum
        ? findVariantByArtnum(normalizedVariants, options.initialVariantArtnum)
        : null,
    [configurable, normalizedVariants, options.initialVariantArtnum]
  );

  const [selectedValues, setSelectedValues] = useState<string[]>(() => {
    if (restoredVariant) return [...restoredVariant.values];
    if (configurable) return createEmptySelection(labels.length);
    return [];
  });

  const [selectedVariant, setSelectedVariant] = useState<NormalizedVariant | null>(
    () => restoredVariant
  );

  const availableByIndex = useMemo(
    () =>
      getAvailableOptionsByIndex(
        normalizedVariants,
        selectedValues,
        labels.length
      ),
    [normalizedVariants, selectedValues, labels.length]
  );

  const displayProduct = useMemo(() => {
    if (!configurable || !selectedVariant) return product;
    return mapVariantToDisplayProduct(product, selectedVariant);
  }, [configurable, product, selectedVariant]);

  const isVariantSelectionComplete =
    !configurable || (isSelectionComplete(selectedValues) && selectedVariant !== null);

  const onSelectValue = useCallback(
    (index: number, value: string) => {
      const { selectedValues: nextValues, selectedVariant: nextVariant } =
        resolveSelectionChange(
          normalizedVariants,
          lookup,
          selectedValues,
          index,
          value,
          labels.length
        );
      setSelectedValues(nextValues);
      setSelectedVariant(nextVariant);
    },
    [lookup, labels.length, normalizedVariants, selectedValues]
  );

  return {
    hasVariants: configurable,
    labels,
    selectedValues,
    selectedVariant,
    isVariantSelectionComplete,
    displayProduct,
    optionsByIndex,
    availableByIndex,
    onSelectValue,
  };
}
