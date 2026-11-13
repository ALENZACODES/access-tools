import type { Language } from "./types.js";

export const GAMES_BOUNDARY: Record<Language, string> = {
  en: "These exercises are for enjoyment and practice. Scores measure performance inside the exercise only. The App does not provide medical advice.",
  fr: "Ces exercices sont pour le plaisir et la pratique. Les pointages mesurent seulement le résultat dans l'exercice. L'application ne donne pas d'avis médical.",
};

export const ROUND_DONE: Record<Language, string> = {
  en: "Round finished. You can stop here. Nothing else in the App changes.",
  fr: "Manche terminée. Vous pouvez vous arrêter ici. Rien d'autre dans l'application ne change.",
};

export const PRACTICE_DONE: Record<Language, string> = {
  en: "Practice finished. No score is kept and no record changes.",
  fr: "Pratique terminée. Aucun pointage n'est gardé et aucun dossier ne change.",
};

export const PRACTICE_BANNER: Record<Language, string> = {
  en: "Practice. No score is shown, and this round is not saved.",
  fr: "Pratique. Aucun pointage n'est affiché, et cette manche n'est pas enregistrée.",
};

export const DAILY_NOTE: Record<Language, string> = {
  en: "A suggestion for enjoyment and practice, not a prescription. The same date shows the same three games.",
  fr: "Une suggestion pour le plaisir et la pratique, pas une prescription. La même date montre les trois mêmes jeux.",
};

export const GRACE_RULE: Record<Language, string> = {
  en: "Two missed days do not break the streak. A third missed day starts it over. The count stays on this device.",
  fr: "Deux jours manqués ne brisent pas la série. Un troisième jour manqué la recommence. Le compte reste sur cet appareil.",
};
