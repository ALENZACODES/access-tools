import { MODEL_COPY } from "./modelCopy.js";
import type { Lang } from "./types.js";

/**
 * Every user-facing enum has an English string and a French string.
 * A blank French value fails assertFrenchCatalog.
 */
export const COPY = {
  "placeType.simple-venue": { en: "Simple venue", fr: "Lieu simple" },
  "placeType.complex-venue": { en: "Complex venue", fr: "Lieu complexe" },
  "placeType.transit-station": { en: "Transit station", fr: "Station de transport" },
  "placeType.trailhead": { en: "Trailhead", fr: "Départ de sentier" },
  "placeType.hotel-room": { en: "Hotel room", fr: "Chambre d'hôtel" },
  "placeType.parking-lot": { en: "Parking lot", fr: "Stationnement" },
  "placeType.skeleton": { en: "Skeleton seed", fr: "Graine incomplète" },
  "category.community-centre": { en: "Community centre", fr: "Centre communautaire" },
  "category.cafe": { en: "Café", fr: "Café" },
  "category.parking": { en: "Parking", fr: "Stationnement" },
  "category.library": { en: "Library", fr: "Bibliothèque" },
  "category.repair": { en: "Repair", fr: "Réparation" },
  "category.trail": { en: "Trail", fr: "Sentier" },
  "category.not-seeded": { en: "Not seeded", fr: "Pas encore semé" },
  "dataset.labelled-fixture": { en: "Labelled fixture", fr: "Jeu d'essai étiqueté" },
  "dataset.prototype-seed": { en: "Prototype seed", fr: "Graine de prototype" },
  "dataset.access-maps": { en: "access-maps", fr: "access-maps" },
  "depth.bounded-seed": { en: "Bounded seed", fr: "Graine bornée" },
  "depth.skeleton": { en: "Skeleton", fr: "Squelette" },
  "supply.catheter-supplies": { en: "Catheter supplies", fr: "Fournitures pour sondes" },
  "supply.continence-products": { en: "Continence products", fr: "Produits de continence" },
  "supply.bowel-care-supplies": { en: "Bowel-care supplies", fr: "Fournitures pour les soins intestinaux" },
  "supply.skin-care-products": { en: "Skin-care products", fr: "Produits pour la peau" },
  "repair.manual-chair": { en: "Manual chair", fr: "Fauteuil manuel" },
  "repair.power-chair": { en: "Power chair", fr: "Fauteuil motorisé" },
  "repair.seating-adjustment": { en: "Seating adjustment", fr: "Réglage du siège" },
  "repair.tyre": { en: "Tyre", fr: "Pneu" },
  "repair.caster": { en: "Caster", fr: "Roulette" },
  "repair.battery": { en: "Battery", fr: "Batterie" },
  "repair.mobile": { en: "Mobile service", fr: "Service mobile" },
  "repair.out-of-hours": { en: "Out of hours", fr: "Hors des heures" },
  "door.operator.manual": { en: "Manual", fr: "Manuelle" },
  "door.operator.automatic": { en: "Automatic", fr: "Automatique" },
  "door.operator.power-assist": { en: "Power assist", fr: "Assistance électrique" },
  "door.swing.in": { en: "In", fr: "Vers l'intérieur" },
  "door.swing.out": { en: "Out", fr: "Vers l'extérieur" },
  "door.swing.sliding": { en: "Sliding", fr: "Coulissante" },
  "door.lock.none": { en: "None", fr: "Aucun" },
  "door.lock.privacy": { en: "Privacy", fr: "Intimité" },
  "door.lock.key": { en: "Key", fr: "Clé" },
  "door.lock.code": { en: "Code", fr: "Code" },
  "door.lock.staff": { en: "Staff", fr: "Personnel" },
  "access.open": { en: "Open", fr: "Ouvert" },
  "access.key": { en: "Key", fr: "Clé" },
  "access.code": { en: "Code", fr: "Code" },
  "access.staff-assisted": { en: "Staff-assisted", fr: "Avec le personnel" },
  "access.permission": { en: "Permission required", fr: "Permission requise" },
  "setting.indoor": { en: "Indoor", fr: "Intérieur" },
  "setting.outdoor": { en: "Outdoor", fr: "Extérieur" },
  "gender.women": { en: "Women", fr: "Femmes" },
  "gender.men": { en: "Men", fr: "Hommes" },
  "gender.all-gender": { en: "All-gender", fr: "Tous genres" },
  "gender.family": { en: "Family", fr: "Familiale" },
  "bay.type-a-van": { en: "Type A van-accessible bay", fr: "Place de type A accessible aux fourgons" },
  "bay.type-b-standard": { en: "Type B standard bay", fr: "Place de type B standard" },
  "bay.drop-off": { en: "Drop-off", fr: "Dépose" },
  "bay.unreviewed": { en: "Bay details not independently checked", fr: "Détails de la place non contrôlés" },
  "problem.locked": { en: "Locked", fr: "Verrouillé" },
  "problem.out-of-order": { en: "Out of order", fr: "Hors service" },
  "problem.used-as-storage": { en: "Used as storage", fr: "Utilisé comme rangement" },
  "problem.entrance-blocked": { en: "Entrance blocked", fr: "Entrée bloquée" },
  "problem.bay-blocked": { en: "Bay blocked", fr: "Place bloquée" },
  "problem.snow-blocked": { en: "Snow blocked", fr: "Bloqué par la neige" },
  "problem.outlet-blocked": { en: "Outlet blocked", fr: "Prise bloquée" },
  "problem.permission-refused": { en: "Permission refused", fr: "Permission refusée" },
  "problem.point-removed": { en: "Point removed", fr: "Point retiré" },
  "problem.business-closed": { en: "Business closed", fr: "Commerce fermé" },
  "problem.moved": { en: "Moved", fr: "Déménagé" },
  "problem.service-not-offered": { en: "Service not offered", fr: "Service non offert" },
  "problem.other": { en: "Other", fr: "Autre" },
  "side.left": { en: "Left", fr: "Gauche" },
  "side.right": { en: "Right", fr: "Droite" },
  "side.both": { en: "Both", fr: "Les deux" },
  "note.english-only": {
    en: "English only. This is sample fixture text and has no French translation.",
    fr: "Anglais seulement. Ce texte est un texte de jeu d'essai et n'a pas de traduction française.",
  },
  "note.english-only-label": { en: "English only.", fr: "English only." },
  "status.prototype-sample": { en: "PROTOTYPE-UNVERIFIED", fr: "PROTOTYPE-UNVERIFIED" },
  "nav.skip": { en: "Skip to content", fr: "Aller au contenu" },
  "switch.help": {
    en: "Switch uses Next, then Choose. Space activates the focused button. Tab moves in order. There is no running scan.",
    fr: "Le contacteur utilise Suivant, puis Choisir. Espace active le bouton qui a le focus. La tabulation avance dans l'ordre. Il n'y a pas de balayage automatique.",
  },
  "switch.next": { en: "Next", fr: "Suivant" },
  "switch.choose": { en: "Choose", fr: "Choisir" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
  "demo.place-title": { en: "the application — place pages", fr: "l'application — pages de lieux" },
  "nav.fixture-places": { en: "Fixture places", fr: "Lieux du jeu d'essai" },
  "nav.labelled-places": { en: "Labelled places", fr: "Lieux étiquetés" },
  "place.peer-tips": { en: "Peer tips, not facts", fr: "Notes de pairs, pas des faits" },
  "place.pending": { en: "Pending on this device", fr: "En attente sur cet appareil" },
  "place.pending.counts": {
    en: "{corrections} pending correction(s), {changes} pending change report(s). The displayed record is unchanged.",
    fr: "{corrections} correction(s) en attente, {changes} signalement(s) en attente. La fiche affichée est inchangée.",
  },
  "place.no-report": { en: "No report is saved on this device.", fr: "Aucun signalement enregistré sur cet appareil." },
  "place.pending-correction": { en: "Pending correction", fr: "Correction en attente" },
  "place.pending-change": { en: "Pending change report", fr: "Signalement en attente" },
  "place.field": { en: "Field", fr: "Champ" },
  "place.suggest": { en: "Suggest a correction", fr: "Proposer une correction" },
  "place.report-change": { en: "Report a change", fr: "Signaler un changement" },
  "form.correction.intro": {
    en: "The correction stays on this device, pending. It does not change the record. Moderation is not running in this prototype.",
    fr: "La correction reste sur cet appareil, en attente. Elle ne change pas la fiche. La modération n'est pas active dans ce prototype.",
  },
  "form.correction.error": { en: "Write the suggested correction.", fr: "Écrivez la correction proposée." },
  "form.correction.suggested": { en: "Suggested correction", fr: "Correction proposée" },
  "form.note-optional": { en: "Note (optional)", fr: "Note (facultative)" },
  "form.correction.save": { en: "Save correction on this device", fr: "Enregistrer la correction sur cet appareil" },
  "form.change.intro": {
    en: "Report a change. The report stays pending and does not erase the record.",
    fr: "Signaler un changement. Le signalement est en attente et n'efface pas la fiche.",
  },
  "form.problem": { en: "Problem", fr: "Problème" },
  "form.change.save": { en: "Save report on this device", fr: "Enregistrer le signalement sur cet appareil" },
  "table.col.field": { en: "Field", fr: "Champ" },
  "table.col.value": { en: "Value", fr: "Valeur" },
  "table.col.tier": { en: "Tier", fr: "Niveau" },
  "table.col.source": { en: "Source", fr: "Source" },
  "table.col.source-date": { en: "Source date", fr: "Date de source" },
  "table.col.record-date": { en: "Record date", fr: "Date de fiche" },
  "table.fields": { en: "fields", fr: "champs" },
  "table.caption.prefix": { en: "Fields: ", fr: "Champs\u00A0: " },
  "section.getting-there": { en: "Getting there", fr: "S'y rendre" },
  "section.inside": { en: "Inside", fr: "À l'intérieur" },
  "table.caption.getting-there": { en: "Getting there fields", fr: "Champs pour s'y rendre" },
  "table.caption.inside": { en: "Inside fields", fr: "Champs de l'intérieur" },
  "table.caption.elided": { en: "Fields of ", fr: "Champs d'" },
  "table.caption.of": { en: "Fields of ", fr: "Champs de " },
  "provenance.source.labelled-fixture": {
    en: "access-tools labelled fixture",
    fr: "jeu d'essai étiqueté access-tools",
  },
  "provenance.source.skeleton-seed": {
    en: "access-tools skeleton seed",
    fr: "graine squelette access-tools",
  },
  "provenance.licence.labelled-fixture": {
    en: "Labelled fixture. Not a data licence. Not a real-world observation.",
    fr: "Jeu d'essai étiqueté. Pas une licence de données. Pas une observation du monde réel.",
  },
  "provenance.licence.skeleton-seed": {
    en: "Skeleton seed. Not a data licence. No venue is identified.",
    fr: "Graine squelette. Pas une licence de données. Aucun lieu n'est identifié.",
  },
  "pack.unnamed": { en: "Unnamed place", fr: "Lieu sans nom" },
  "pack.unknown": { en: "Unknown", fr: "Inconnu" },
  "pack.english-only-note": { en: "English only", fr: "en anglais seulement" },
  "pack.source": { en: "Source", fr: "Source" },
  "pack.licence": { en: "Licence", fr: "Licence" },
  "pack.retrieved": { en: "Retrieved", fr: "Récupéré le" },
  "pack.tier": { en: "Tier", fr: "Niveau" },
  "pack.field": { en: "Field", fr: "Champ" },
  "pack.value": { en: "Value", fr: "Valeur" },
  "pack.details": { en: "Recorded fields", fr: "Champs consignés" },
  "pack.other": { en: "Other recorded details", fr: "Autres détails consignés" },
  "pack.fit": { en: "Fit with your profile", fr: "Compatibilité avec votre profil" },
  "pack.correction": { en: "Suggest a correction", fr: "Proposer une correction" },
  "pack.photo-add": { en: "Add a photo", fr: "Ajouter une photo" },
  "pack.photo-show": { en: "Show photo", fr: "Afficher la photo" },
  "pack.photo-none": { en: "No open-licence photo yet", fr: "Aucune photo sous licence ouverte pour le moment" },
  "pack.photo-loading": { en: "Loading photo…", fr: "Chargement de la photo…" },
  "pack.photo-unavailable": { en: "No accepted open-licence photo available", fr: "Aucune photo sous licence ouverte acceptée n’est disponible" },
  "pack.photo-error": { en: "Could not load photo details", fr: "Impossible de charger les détails de la photo" },
  "pack.photo-credit": { en: "Photo credit: {author}", fr: "Crédit photo\u00A0: {author}" },
  "pack.profile": { en: "Door width is compared with your saved chair width when available.", fr: "La largeur de la porte est comparée à celle de votre fauteuil enregistré, si elle est disponible." },
  "pack.yes": { en: "Known yes", fr: "Oui connu" },
  "pack.no": { en: "Known no", fr: "Non connu" },
  "pack.deciding": { en: "Deciding field", fr: "Champ déterminant" },
  "pack.recorded": { en: "Record: {id}", fr: "Fiche\u00A0: {id}" },
  "pack.venue": { en: "Venue", fr: "Lieu" },
  "pack.washroom": { en: "Washroom", fr: "Toilettes" },
  "pack.transit": { en: "Transit stop", fr: "Arrêt de transport" },
  "pack.path": { en: "Path", fr: "Sentier" },
  "pack.step-free": { en: "Step-free entrance", fr: "Entrée sans marche" },
  "pack.washroom-need": { en: "Accessible washroom", fr: "Toilettes accessibles" },
  "pack.door-width": { en: "Door width for your chair", fr: "Largeur de porte pour votre fauteuil" },
  "pack.change-table": { en: "Adult changing table", fr: "Table à langer pour adultes" },
  "pack.parking": { en: "Accessible parking", fr: "Stationnement accessible" },
  "pack.source-missing": { en: "Unlisted source", fr: "Source non répertoriée" },
  "pack.osm": { en: "© OpenStreetMap contributors, ODbL", fr: "© contributeurs OpenStreetMap, ODbL" },
  "pack.commons-credit": { en: "Wikimedia Commons", fr: "Wikimedia Commons" },
  "pack.no-fields": { en: "No fields recorded", fr: "Aucun champ consigné" },
  "pack.field-key.name": { en: "Name", fr: "Nom" },
  "pack.field-key.address": { en: "Address", fr: "Adresse" },
  "pack.field-key.addr-full": { en: "Address", fr: "Adresse" },
  "pack.field-key.addr-street": { en: "Street", fr: "Rue" },
  "pack.field-key.official-name": { en: "Official name", fr: "Nom officiel" },
  "pack.field-key.ref": { en: "Reference", fr: "Référence" },
  "pack.field-key.entrance-step-free": { en: "Step-free entrance", fr: "Entrée sans marche" },
  "pack.field-key.step-free": { en: "Step-free", fr: "Sans marche" },
  "pack.field-key.wheelchair": { en: "Wheelchair access", fr: "Accès en fauteuil roulant" },
  "pack.field-key.wheelchair-entrance": { en: "Wheelchair entrance", fr: "Entrée en fauteuil roulant" },
  "pack.field-key.toilets-wheelchair": { en: "Wheelchair-accessible toilets", fr: "Toilettes accessibles en fauteuil roulant" },
  "pack.field-key.wheelchair-toilet": { en: "Wheelchair-accessible toilets", fr: "Toilettes accessibles en fauteuil roulant" },
  "pack.field-key.accessible-toilet": { en: "Accessible washroom", fr: "Toilettes accessibles" },
  "pack.field-key.washroom-accessible": { en: "Accessible washroom", fr: "Toilettes accessibles" },
  "pack.field-key.door-width": { en: "Door width", fr: "Largeur de porte" },
  "pack.field-key.entrance-width": { en: "Entrance width", fr: "Largeur d’entrée" },
  "pack.field-key.door-clear-width-mm": { en: "Door clear width", fr: "Largeur libre de porte" },
  "pack.field-key.door-width-mm": { en: "Door width", fr: "Largeur de porte" },
  "pack.field-key.changing-table-adult": { en: "Adult change table", fr: "Table à langer pour adultes" },
  "pack.field-key.adult-changing-table": { en: "Adult change table", fr: "Table à langer pour adultes" },
  "pack.field-key.adult-change-table": { en: "Adult change table", fr: "Table à langer pour adultes" },
  "pack.field-key.changing-table": { en: "Changing table", fr: "Table à langer" },
  "pack.field-key.parking-wheelchair": { en: "Accessible parking", fr: "Stationnement accessible" },
  "pack.field-key.disabled-parking": { en: "Accessible parking", fr: "Stationnement accessible" },
  "pack.field-key.accessible-parking": { en: "Accessible parking", fr: "Stationnement accessible" },
  "pack.field-key.parking-access": { en: "Parking access", fr: "Accès au stationnement" },
  "pack.field-key.survey-note": { en: "Survey note", fr: "Note de relevé" },
  "pack.field-key.wikimedia-commons": { en: "Wikimedia Commons", fr: "Wikimedia Commons" },
  "pack.field-key.image": { en: "Image", fr: "Image" },
  "pack.field-key.change-table": { en: "Adult change table", fr: "Table à langer pour adultes" },
  "pack.fit-item": { en: "{need}: {status}. Deciding field:", fr: "{need}\u00A0: {status}. Champ déterminant\u00A0:" },
  ...MODEL_COPY,
} as const;

const AUTHORED_KEYS: Record<string, CopyKey> = {
  "access-tools labelled fixture": "provenance.source.labelled-fixture",
  "access-tools skeleton seed": "provenance.source.skeleton-seed",
  "Labelled fixture. Not a data licence. Not a real-world observation.": "provenance.licence.labelled-fixture",
  "Skeleton seed. Not a data licence. No venue is identified.": "provenance.licence.skeleton-seed",
};

/** Translates the fixed provenance sentences used by labelled fixtures and skeleton seeds. */
export function localizeAuthored(text: string, lang: Lang): string {
  const key = AUTHORED_KEYS[text];
  if (!key) return text;
  return copy(key, lang);
}

export type CopyKey = keyof typeof COPY;

export function copy(key: CopyKey, lang: Lang): string {
  const row = COPY[key];
  return lang === "fr" ? row.fr : row.en;
}

/** Catalogue string with `{name}` placeholders filled. */
export function phrase(key: CopyKey, lang: Lang, values: Record<string, string | number> = {}): string {
  return fill(copy(key, lang), values);
}

/**
 * A French colon takes a no-break space. A time or ratio such as 09:00 is left alone.
 * Returns the catalogue keys that still use a plain space.
 */
export function frenchColonViolations(catalog: Record<string, { fr: string }>): string[] {
  const bad: string[] = [];
  for (const [key, row] of Object.entries(catalog)) {
    const fr = row.fr;
    for (let index = 0; index < fr.length; index += 1) {
      if (fr[index] !== ":") continue;
      const previous = fr[index - 1];
      if (previous === undefined || /\d/.test(previous)) continue;
      if (previous !== "\u00A0") bad.push(key);
    }
  }
  return bad;
}

/** Fills `{name}` placeholders in a catalogue string. */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

/** Looks up a catalogue key. An unknown key stays visible so a missing translation fails the French screen test. */
export function labelOf(key: string, lang: Lang): string {
  const row = COPY[key as CopyKey];
  if (!row) return key;
  return lang === "fr" ? row.fr : row.en;
}

export function assertFrenchCatalog(catalog: Record<string, { en: string; fr: string }>): void {
  const missing: string[] = [];
  for (const [key, row] of Object.entries(catalog)) {
    if (!row || typeof row.en !== "string" || row.en.trim() === "") missing.push(`${key}:en`);
    if (!row || typeof row.fr !== "string" || row.fr.trim() === "") missing.push(`${key}:fr`);
  }
  if (missing.length > 0) {
    throw new Error(`missing translation keys: ${missing.join(", ")}`);
  }
}
