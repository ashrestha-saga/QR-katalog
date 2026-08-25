import { WIZARD_HAENDLER_STEP_ENABLED } from "./wizard-config";

export const STEP_DESKTOP_TITLES: Record<number, string> =
  WIZARD_HAENDLER_STEP_ENABLED
    ? {
        1: "Schritt 1 — Produkt",
        2: "Schritt 2 — Händler",
        3: "Schritt 3 — Bestellung",
      }
    : {
        1: "Schritt 1 — Produkt",
        2: "Schritt 2 — Bestellung",
      };

export const STEP_MOBILE_TITLES: Record<number, string> =
  WIZARD_HAENDLER_STEP_ENABLED
    ? {
        1: "Produkt gescannt",
        2: "Händler wählen",
        3: "Bestellung",
      }
    : {
        1: "Produkt gescannt",
        2: "Bestellung",
      };

export const STEP_MOBILE_SUBTITLES: Record<number, string> =
  WIZARD_HAENDLER_STEP_ENABLED
    ? {
        1: "Produktdetails — im nächsten Schritt Händler wählen.",
        2: "Wähle deinen Händler — danach zum Warenkorb.",
        3: "Menge und Gesamtbetrag prüfen.",
      }
    : {
        1: "Produktdetails, Menge wählen und im Warenkorb speichern.",
        2: "Menge und Gesamtbetrag prüfen.",
      };
