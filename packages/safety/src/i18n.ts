import type { Language } from "./types.js";

const NB = " ";

/** All user-facing strings. French uses U+00A0 before : ; ? ! and inside « ». */
export const SAFETY_COPY = {
  "safety.title": { en: "Trip safety", fr: "Sécurité des déplacements" },
  "safety.boundary": {
    en: "The App does not dispatch help. It does not call, text or alert anyone, including emergency services. It does not track or send your location, and it has no server that follows your trip. Everything stays on this device unless you copy it yourself. If you may need emergency help, call 911 before anything else.",
    fr: `L'application n'envoie pas d'aide. Elle n'appelle, ne texte et n'alerte personne, y compris les services d'urgence. Elle ne suit ni n'envoie votre position et n'a aucun serveur qui suit votre déplacement. Tout reste sur cet appareil, sauf si vous le copiez vous-même. Si vous avez peut-être besoin d'aide d'urgence, composez le 911 avant toute autre chose.`,
  },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
  "copy.done": { en: "Copied.", fr: "Copié." },
  "copy.failed": {
    en: "Could not copy. Select the text and copy it yourself.",
    fr: "Copie impossible. Sélectionnez le texte et copiez-le vous-même.",
  },

  "checkin.heading": { en: "Trip check-in", fr: "Contrôle de déplacement" },
  "checkin.intro": {
    en: "Start a window for your trip. Nothing is sent anywhere. The App only shows, on this device, whether the window is still open.",
    fr: "Démarrez une fenêtre pour votre déplacement. Rien n'est envoyé nulle part. L'application indique seulement, sur cet appareil, si la fenêtre est encore ouverte.",
  },
  "checkin.duration-label": { en: "Window length", fr: "Durée de la fenêtre" },
  "checkin.minutes": { en: "{n} minutes", fr: "{n} minutes" },
  "checkin.start": { en: "Start check-in window", fr: "Démarrer la fenêtre de contrôle" },
  "checkin.ok": { en: "I'm OK", fr: "Je vais bien" },
  "checkin.help": { en: "I need help contacting someone", fr: "J'ai besoin d'aide pour joindre quelqu'un" },
  "checkin.close": { en: "Close check-in", fr: "Fermer la contrôle" },
  "checkin.status-idle": { en: "No check-in is running.", fr: "Aucune contrôle n'est en cours." },
  "checkin.status-active": {
    en: "Check-in window open until {time}. Nothing is sent anywhere.",
    fr: `Fenêtre de contrôle ouverte jusqu'à ${"{time}"}. Rien n'est envoyé nulle part.`,
  },
  "checkin.status-overdue": {
    en: "Your check-in window ended at {time}. The App has not alerted anyone. Mark yourself OK, or choose to get help contacting someone.",
    fr: "Votre fenêtre de contrôle a pris fin à {time}. L'application n'a alerté personne. Indiquez que vous allez bien ou choisissez d'obtenir de l'aide pour joindre quelqu'un.",
  },
  "checkin.status-ok": {
    en: "Marked OK at {time}. The window is closed. Nobody was told.",
    fr: `Marqué «${NB}Je vais bien${NB}» à {time}. La fenêtre est fermée. Personne n'a été informé.`,
  },
  "checkin.status-help": {
    en: "You marked that you need help contacting someone. The App has not contacted anyone.",
    fr: "Vous avez indiqué avoir besoin d'aide pour joindre quelqu'un. L'application n'a contacté personne.",
  },
  "help.heading": { en: "Ways to reach help", fr: "Façons d'obtenir de l'aide" },
  "help.links-label": { en: "Emergency pathways", fr: "Voies d'urgence" },
  "help.source": { en: "Official page", fr: "Page officielle" },
  "help.summary-label": { en: "Summary you can copy", fr: "Résumé que vous pouvez copier" },
  "help.summary-note": {
    en: "This summary was written on this device. The App has not sent it to anyone. Paste it into a message yourself if you want to.",
    fr: "Ce résumé a été rédigé sur cet appareil. L'application ne l'a envoyé à personne. Collez-le dans un message vous-même si vous le souhaitez.",
  },
  "help.copy": { en: "Copy summary", fr: "Copier le résumé" },
  "summary.title": { en: "Trip check-in summary", fr: "Résumé de contrôle de déplacement" },
  "summary.started": { en: "Check-in started: {time}", fr: `Contrôle démarrée${NB}: {time}` },
  "summary.due": { en: "Check-in window ended: {time}", fr: `Fin de la fenêtre${NB}: {time}` },
  "summary.status": { en: "Status: needs help contacting someone", fr: `État${NB}: a besoin d'aide pour joindre quelqu'un` },
  "summary.trip": { en: "Trip: {origin} to {destination}", fr: `Déplacement${NB}: {origin} vers {destination}` },
  "summary.window": { en: "Expected window: {start} to {end}", fr: `Fenêtre prévue${NB}: {start} à {end}` },
  "summary.notes": { en: "Notes: {notes}", fr: `Notes${NB}: {notes}` },
  "summary.footer": {
    en: "Written on this device by the App. Not sent to anyone. The App does not dispatch help.",
    fr: "Rédigé sur cet appareil par l'application. Non envoyé. L'application n'envoie pas d'aide.",
  },

  "trip.heading": { en: "Trip share", fr: "Partage de déplacement" },
  "trip.intro": {
    en: "Make a local, time-limited text you can copy and give to someone you trust. There is no tracking server. The text stops working after it expires.",
    fr: "Créez un texte local à durée limitée que vous pouvez copier et remettre à une personne de confiance. Il n'y a aucun serveur de suivi. Le texte cesse de fonctionner à son expiration.",
  },
  "trip.origin": { en: "Origin label", fr: "Libellé de départ" },
  "trip.destination": { en: "Destination label", fr: "Libellé de destination" },
  "trip.start": { en: "Expected start", fr: "Début prévu" },
  "trip.end": { en: "Expected end", fr: "Fin prévue" },
  "trip.notes": { en: "Notes (optional)", fr: "Notes (facultatif)" },
  "trip.create": { en: "Create trip share", fr: "Créer le partage" },
  "trip.payload-label": { en: "Trip share text", fr: "Texte du partage" },
  "trip.copy": { en: "Copy trip share", fr: "Copier le partage" },
  "trip.revoke": { en: "Revoke on this device", fr: "Révoquer sur cet appareil" },
  "trip.expires": { en: "Expires at {time}.", fr: "Expire à {time}." },
  "trip.expired": {
    en: "This trip share expired at {time}. The text is dead and is no longer shown.",
    fr: "Ce partage a expiré à {time}. Le texte est mort et n'est plus affiché.",
  },
  "trip.revoked": {
    en: "This trip share was revoked on this device. The text is no longer shown.",
    fr: "Ce partage a été révoqué sur cet appareil. Le texte n'est plus affiché.",
  },
  "trip.revoke-note": {
    en: "Revoking works on this device. The App cannot take back a copy you already gave someone, so the share also dies by itself at the expiry time.",
    fr: `La révocation s'applique à cet appareil. L'application ne peut pas reprendre une copie déjà remise${NB}; le partage meurt aussi de lui-même à l'heure d'expiration.`,
  },
  "trip.check-heading": { en: "Check a trip share", fr: "Contrôler un partage" },
  "trip.check-label": { en: "Pasted trip share text", fr: "Texte de partage collé" },
  "trip.check-button": { en: "Check", fr: "Contrôler" },
  "trip.check-live": {
    en: "Live until {time}: {origin} to {destination}.",
    fr: `Actif jusqu'à {time}${NB}: {origin} vers {destination}.`,
  },
  "trip.check-expired": { en: "Expired at {time}. Nothing is shown.", fr: "Expiré à {time}. Rien n'est affiché." },
  "trip.check-revoked": { en: "Revoked on this device. Nothing is shown.", fr: "Révoqué sur cet appareil. Rien n'est affiché." },
  "trip.check-invalid": { en: "This is not a trip share from the App.", fr: "Ce texte n'est pas un partage de l'application." },
  "error.origin-required": { en: "Enter an origin label.", fr: "Saisissez un libellé de départ." },
  "error.destination-required": { en: "Enter a destination label.", fr: "Saisissez un libellé de destination." },
  "error.label-long": { en: "Labels can be at most 80 characters.", fr: "Les libellés peuvent compter au plus 80 caractères." },
  "error.notes-long": { en: "Notes can be at most 280 characters.", fr: "Les notes peuvent compter au plus 280 caractères." },
  "error.window-invalid": { en: "Enter a start and an end, with the end after the start.", fr: "Saisissez un début et une fin, la fin étant après le début." },
  "error.window-ended": { en: "The expected end has already passed.", fr: "La fin prévue est déjà passée." },

  "disruption.heading": { en: "Disruption mode", fr: "Mode perturbation" },
  "disruption.status-line": { en: "Outage status: {status}", fr: `État des pannes${NB}: {status}` },
  "disruption.unknown": { en: "Unknown", fr: "Inconnu" },
  "disruption.clear": { en: "Reported clear", fr: "Signalé sans panne" },
  "disruption.disrupted": { en: "Reported disrupted", fr: "Signalé perturbé" },
  "disruption.unknown-copy": {
    en: "Live elevator or outage status is not connected here. The App does not know whether any station, elevator or route is working. Check with the operator before you travel.",
    fr: "L'état en direct des ascenseurs ou des pannes n'est pas connecté ici. L'application ne sait pas si une station, un ascenseur ou un trajet fonctionne. Contrôlez auprès de l'exploitant avant de partir.",
  },
  "disruption.snapshot-copy": {
    en: "This is a stored snapshot, not a live feed. It may be out of date.",
    fr: "Ceci est un instantané enregistré, non un flux en direct. Il peut être périmé.",
  },
  "disruption.id": { en: "Station or segment", fr: "Station ou tronçon" },
  "disruption.source": { en: "Source", fr: "Source" },
  "disruption.licence": { en: "Licence", fr: "Licence" },
  "disruption.retrieved": { en: "Retrieved", fr: "Consulté" },
  "disruption.expires": { en: "Expires", fr: "Expire" },
  "disruption.tier": { en: "Evidence review tier", fr: "Niveau de contrôle" },
  "disruption.tier-line": {
    en: "Evidence review tier: {tier}. Prototype data only. No outage is invented here.",
    fr: `Niveau de contrôle${NB}: {tier}. Données de prototype seulement. Aucune panne n'est inventée ici.`,
  },
} as const;

export type SafetyCopyKey = keyof typeof SAFETY_COPY;

export function safetyCopy(key: SafetyCopyKey, language: Language, vars?: Record<string, string | number>): string {
  const row = SAFETY_COPY[key];
  const template: string = language === "fr" ? row.fr : row.en;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}
