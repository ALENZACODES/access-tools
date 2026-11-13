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
  "bay.unverified": { en: "Unverified bay", fr: "Place non vérifiée" },
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
  "region.fields": { en: "fields", fr: "champs" },
  "side.left": { en: "Left", fr: "Gauche" },
  "side.right": { en: "Right", fr: "Droite" },
  "side.both": { en: "Both", fr: "Les deux" },
} as const;

export type CopyKey = keyof typeof COPY;

export function copy(key: CopyKey, lang: Lang): string {
  const row = COPY[key];
  return lang === "fr" ? row.fr : row.en;
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
