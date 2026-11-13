import type { Language } from "./types.js";

export const TIMING_COPY = {
  "timing.title": { en: "Emergency pathways", fr: "Voies d'urgence" },
  "timing.emergency-label": { en: "Emergency pathways", fr: "Voies d'urgence" },
  "timing.source": { en: "Official page", fr: "Page officielle" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
} as const;

export type TimingCopyKey = keyof typeof TIMING_COPY;

export function timingCopy(key: TimingCopyKey, language: Language): string {
  const row = TIMING_COPY[key];
  return language === "fr" ? row.fr : row.en;
}
