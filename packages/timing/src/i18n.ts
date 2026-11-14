import type { Language } from "./types.js";

export const TIMING_COPY = {
  "timing.title": { en: "Emergency pathways", fr: "Voies d'urgence" },
  "timing.emergency-label": { en: "Emergency pathways", fr: "Voies d'urgence" },
  "timing.source": { en: "Official page", fr: "Page officielle" },
  "timing.switch-help": {
    en: "Switch uses Next, then Choose. Space activates the focused button. Tab moves in order. There is no running scan.",
    fr: "Le contacteur utilise Suivant, puis Choisir. Espace active le bouton qui a le focus. La tabulation avance dans l'ordre. Il n'y a pas de balayage automatique.",
  },
  "timing.next": { en: "Next", fr: "Suivant" },
  "timing.choose": { en: "Choose", fr: "Choisir" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
} as const;

export type TimingCopyKey = keyof typeof TIMING_COPY;

export function timingCopy(key: TimingCopyKey, language: Language): string {
  const row = TIMING_COPY[key];
  return language === "fr" ? row.fr : row.en;
}
