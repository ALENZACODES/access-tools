import type { EmergencyPathway } from "./types.js";

/**
 * Pathways retrieved or confirmed on 13 November 2026.
 * 9-8-8: https://988.ca/ (page title and "Call or Text 9-8-8").
 * ConnexOntario: https://connexontario.ca/ phone 1-866-531-2600, text CONNEX to 247247.
 * Health811 was not re-verified in this build, so no 811 number is published here.
 */
export const EMERGENCY_PATHWAYS: readonly EmergencyPathway[] = [
  {
    id: "call-911",
    name: { en: "Call 911", fr: "Composer le 911" },
    action: {
      en: "Call 911 now",
      fr: "Composer le 911 maintenant",
    },
    href: "tel:911",
    detail: {
      en: "For immediate danger or any situation you treat as an emergency. No questions come first. The App does not interpret symptoms.",
      fr: "Pour un danger immédiat ou toute situation que vous traitez comme une urgence. Aucune question avant l'appel. L'application n'interprète pas les symptômes.",
    },
    sourceUrl: null,
    retrievedOn: null,
  },
  {
    id: "suicide-crisis-helpline-988",
    name: {
      en: "9-8-8 Suicide Crisis Helpline",
      fr: "9-8-8 Ligne d'aide en cas de crise de suicide",
    },
    action: {
      en: "Call 9-8-8",
      fr: "Appeler le 9-8-8",
    },
    href: "tel:988",
    textAction: {
      en: "Text 9-8-8 Suicide Crisis Helpline",
      fr: "Texter le 9-8-8 Ligne d'aide en cas de crise de suicide",
    },
    textHref: "sms:988",
    detail: {
      en: "The public 9-8-8 page, retrieved 13 November 2026, says to call or text 9-8-8. The App is not a crisis service and does not ask you to describe a crisis in the App.",
      fr: "La page publique 9-8-8, consultée le 13 novembre 2026, invite à appeler ou à texter le 9-8-8. L'application n'est pas un service de crise et ne demande pas de décrire une crise dans l'application.",
    },
    sourceUrl: "https://988.ca/",
    retrievedOn: "2026-11-13",
  },
  {
    id: "connexontario",
    name: { en: "ConnexOntario", fr: "ConnexOntario" },
    action: {
      en: "Call 1-866-531-2600",
      fr: "Appeler le 1-866-531-2600",
    },
    href: "tel:+18665312600",
    textAction: {
      en: "Text CONNEX to 247247",
      fr: "Texter CONNEX au 247247",
    },
    textHref: "sms:247247?&body=CONNEX",
    detail: {
      en: "ConnexOntario's site, retrieved 13 November 2026, publishes 1-866-531-2600 and text CONNEX to 247247 for mental health, addiction, and problem gambling connections. The App does not assess risk.",
      fr: "Le site de ConnexOntario, consulté le 13 novembre 2026, publie le 1-866-531-2600 et le texto CONNEX au 247247 pour la santé mentale, les dépendances et le jeu problématique. L'application n'évalue pas le risque.",
    },
    sourceUrl: "https://connexontario.ca/",
    retrievedOn: "2026-11-13",
  },
];
