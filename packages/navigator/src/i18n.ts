import type { Language } from "./types.js";

export const DIRECTORY_COPY = {
  "dir.title": { en: "Directory", fr: "Répertoire" },
  "dir.search": { en: "Search programs and services", fr: "Chercher des programmes et des services" },
  "dir.filters": { en: "Categories", fr: "Catégories" },
  "dir.results": { en: "records. Each one links out. None is an application.", fr: "fiches. Chacune mène ailleurs. Aucune n'est une demande." },
  "dir.checked": { en: "Page checked", fr: "Page consultée" },
  "dir.open": { en: "Official page:", fr: "Page officielle\u00A0:" },
  "dir.french-page": { en: "Official French page", fr: "Page officielle en français" },
  "dir.call": { en: "Call", fr: "Appeler" },
  "dir.text-988": { en: "Text 9-8-8 Suicide Crisis Helpline", fr: "Texter le 9-8-8 Ligne d'aide en cas de crise de suicide" },
  "dir.text-connex": { en: "Text CONNEX to 247247", fr: "Texter CONNEX au 247247" },
  "dir.english-only": { en: "English only", fr: "En anglais seulement" },
  "dir.save": { en: "Save this title on this device", fr: "Garder ce titre sur cet appareil" },
  "dir.clear": { en: "Delete the on-device list", fr: "Effacer la liste sur l'appareil" },
  "dir.confirm-clear": { en: "Confirm delete of the on-device list", fr: "Confirmer l'effacement de la liste sur l'appareil" },
  "dir.note": {
    en: "The on-device list is only titles you marked. It is not an application and it is not sent anywhere.",
    fr: "La liste sur l'appareil ne contient que les titres que vous avez marqués. Ce n'est pas une demande et elle n'est envoyée nulle part.",
  },
  "dir.switch-help": {
    en: "Switch uses Next, then Choose. Space activates the focused button. Tab moves in order. There is no running scan.",
    fr: "Le contacteur utilise Suivant, puis Choisir. Espace active le bouton qui a le focus. La tabulation avance dans l'ordre. Il n'y a pas de balayage automatique.",
  },
  "dir.next": { en: "Next", fr: "Suivant" },
  "dir.choose": { en: "Choose", fr: "Choisir" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
} as const;

export type DirectoryCopyKey = keyof typeof DIRECTORY_COPY;

export function directoryCopy(key: DirectoryCopyKey, language: Language): string {
  const row = DIRECTORY_COPY[key];
  return language === "fr" ? row.fr : row.en;
}
