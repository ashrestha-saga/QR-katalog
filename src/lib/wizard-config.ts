/** Phase 2: set true to restore geo/PLZ + region mapping in the dealer step */
export const WIZARD_GEO_STEP_ENABLED = false;

/** Phase 2: set true to restore Händler selection step */
export const WIZARD_HAENDLER_STEP_ENABLED = false;

/** Step index for quantity / order (last step before success) */
export const WIZARD_ORDER_STEP = WIZARD_HAENDLER_STEP_ENABLED ? 3 : 2;

/** Progress indicator total (product → [dealer] → order) */
export const WIZARD_ACTIVE_STEPS = WIZARD_ORDER_STEP;

/** Success screen step number */
export const WIZARD_SUCCESS_STEP = WIZARD_ORDER_STEP + 1;

/** Dealer step index when enabled; otherwise null */
export const WIZARD_DEALER_STEP: number | null = WIZARD_HAENDLER_STEP_ENABLED
  ? 2
  : null;
