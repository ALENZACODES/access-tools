import type { Language } from "./types.js";

export const TIMING_BOUNDARY: Record<Language, string> = {
  en: "Timing notes are only what you type. The App does not set a clinical interval, does not give medical advice, and does not provide pressure-relief, catheter, medication, or symptom reminders. If you may need emergency help, call 911 before anything else.",
  fr: "Les notes de temps sont seulement ce que vous inscrivez. L'application ne fixe pas d'intervalle clinique, ne donne pas d'avis médical et n'offre pas de rappel de soulagement de pression, de cathéter, de médicament ou de symptôme. Si vous avez peut-être besoin d'aide d'urgence, composez le 911 avant toute autre chose.",
};

export const NO_DEFAULT_NOTE: Record<Language, string> = {
  en: "You have not set a timing note. Nothing was filled in for you.",
  fr: "Vous n'avez pas inscrit de note de temps. Rien n'a été rempli à votre place.",
};

export const NOT_A_PLACE_LOOKUP: Record<Language, string> = {
  en: "Washroom stops are supplied by you or by another part of the App. This timing tool does not look up places and does not know which washrooms exist.",
  fr: "Les arrêts toilettes sont fournis par vous ou par une autre partie de l'application. Cet outil de temps ne cherche pas de lieux et ne sait pas quelles toilettes existent.",
};
