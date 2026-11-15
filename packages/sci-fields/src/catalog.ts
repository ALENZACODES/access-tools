import type { FieldDef } from "./types";

const yn = { yes: { en: "Yes", fr: "Oui" }, no: { en: "No", fr: "Non" } };
const bool = { yes: yn.yes, no: yn.no };

export const CATALOG: FieldDef[] = [
  {
    id: "transfer_side", label: { en: "Transfer side", fr: "Côté de transfert" }, kind: "enum",
    values: { left: { en: "Left", fr: "Gauche" }, right: { en: "Right", fr: "Droite" }, both: { en: "Both sides", fr: "Des deux côtés" } },
    needKey: "transfer", expiry: "durable",
    observed: { en: "Noted by looking at which side of the toilet or bench has clear floor space.", fr: "Noté en observant quel côté de la toilette ou du banc a un espace libre au sol." },
  },
  {
    id: "transfer_space_mm", label: { en: "Transfer space", fr: "Espace de transfert" }, kind: "number", unit: "mm",
    needKey: "transfer", expiry: "durable",
    observed: { en: "Measured with a tape beside the toilet or bench, wall to nearest obstacle.", fr: "Mesuré au ruban à côté de la toilette ou du banc, du mur au premier obstacle." },
  },
  {
    id: "turning_space_mm", label: { en: "Turning space", fr: "Espace de virage" }, kind: "number", unit: "mm",
    needKey: "turning", expiry: "durable",
    observed: { en: "Diameter of the largest clear circle measured on the floor.", fr: "Diamètre du plus grand cercle libre mesuré au sol." },
  },
  {
    id: "adult_change_table", label: { en: "Adult change table", fr: "Table à langer pour adultes" }, kind: "boolean", values: bool,
    needKey: "change_table", expiry: "annual",
    observed: { en: "Seen in the washroom on the visit.", fr: "Aperçue dans la salle de toilette lors de la visite." },
  },
  {
    id: "hoist", label: { en: "Hoist", fr: "Lève-personne" }, kind: "enum",
    values: { ceiling: { en: "Ceiling hoist", fr: "Lève-personne au plafond" }, mobile: { en: "Mobile hoist", fr: "Lève-personne mobile" }, none: { en: "None seen", fr: "Aucun observé" } },
    needKey: "hoist", expiry: "annual",
    observed: { en: "Seen in the washroom or change room on the visit.", fr: "Aperçu dans la salle de toilette ou le vestiaire lors de la visite." },
  },
  {
    id: "door_clear_width_mm", label: { en: "Door clear width", fr: "Largeur libre de la porte" }, kind: "number", unit: "mm",
    needKey: "door_width", expiry: "durable",
    observed: { en: "Measured between the door and the frame with the door open to 90 degrees.", fr: "Mesurée entre la porte et le cadre, la porte ouverte à 90 degrés." },
  },
  {
    id: "counter_height_mm", label: { en: "Counter height", fr: "Hauteur du comptoir" }, kind: "number", unit: "mm",
    needKey: "reach", expiry: "durable",
    observed: { en: "Measured from the floor to the top of the service counter.", fr: "Mesurée du sol au-dessus du comptoir de service." },
  },
  {
    id: "lighting", label: { en: "Lighting", fr: "Éclairage" }, kind: "enum",
    values: { dim: { en: "Dim", fr: "Faible" }, moderate: { en: "Moderate", fr: "Modéré" }, bright: { en: "Bright", fr: "Vif" } },
    needKey: "sensory", expiry: "annual",
    observed: { en: "Described from the visit; not a measurement.", fr: "Décrit lors de la visite ; ce n’est pas une mesure." },
  },
  {
    id: "noise", label: { en: "Noise", fr: "Bruit" }, kind: "enum",
    values: { quiet: { en: "Quiet", fr: "Calme" }, moderate: { en: "Moderate", fr: "Modéré" }, loud: { en: "Loud", fr: "Bruyant" } },
    needKey: "sensory", expiry: "visit",
    observed: { en: "Described from the visit at the time noted; not a measurement.", fr: "Décrit lors de la visite à la date indiquée ; ce n’est pas une mesure." },
  },
  {
    id: "staff_will_help", label: { en: "Staff offered help", fr: "Aide offerte par le personnel" }, kind: "boolean", values: bool,
    needKey: "assistance", expiry: "visit",
    observed: { en: "What staff said or did on a dated visit. It describes that visit only.", fr: "Ce que le personnel a dit ou fait lors d’une visite datée. Cela décrit seulement cette visite." },
  },
  {
    id: "open_without_purchase", label: { en: "Washroom open without purchase", fr: "Toilettes accessibles sans achat" }, kind: "boolean", values: bool,
    needKey: "toileting", expiry: "visit",
    observed: { en: "Noted from a sign or from staff on a dated visit.", fr: "Noté d’après une affiche ou le personnel lors d’une visite datée." },
  },
  {
    id: "staff_refuel", label: { en: "Staff will refuel", fr: "Le personnel fait le plein" }, kind: "boolean", values: bool,
    needKey: "fuel", expiry: "visit",
    observed: { en: "Noted from a sign or from staff on a dated visit.", fr: "Noté d’après une affiche ou le personnel lors d’une visite datée." },
  },
  {
    id: "approach_step_free", label: { en: "Step-free approach (last 200 m)", fr: "Approche sans marche (derniers 200 m)" }, kind: "boolean", values: bool,
    needKey: "approach", expiry: "annual",
    observed: { en: "Walked or rolled the last 200 m to the door and noted whether any step was present.", fr: "Derniers 200 m jusqu’à la porte parcourus ; présence ou non d’une marche notée." },
  },
  {
    id: "approach_surface", label: { en: "Approach surface", fr: "Surface de l’approche" }, kind: "enum",
    values: { paved: { en: "Paved", fr: "Pavée" }, gravel: { en: "Gravel", fr: "Gravier" }, cobble: { en: "Cobblestone", fr: "Pavé" }, grass: { en: "Grass", fr: "Gazon" }, mixed: { en: "Mixed", fr: "Mixte" } },
    needKey: "approach", expiry: "annual",
    observed: { en: "Main surface seen over the last 200 m to the door.", fr: "Surface principale observée sur les derniers 200 m jusqu’à la porte." },
  },
  {
    id: "approach_notes", label: { en: "Approach notes", fr: "Notes sur l’approche" }, kind: "text",
    needKey: "approach", expiry: "annual",
    observed: { en: "Free text limited to what the contributor observed on the visit.", fr: "Texte libre limité à ce que la personne a observé lors de la visite." },
  },
  {
    id: "curb_snowbank", label: { en: "Curb / snowbank", fr: "Bordure / banc de neige" }, kind: "enum",
    values: { clear: { en: "Clear", fr: "Dégagé" }, partly_blocked: { en: "Partly blocked", fr: "Partiellement bloqué" }, blocked: { en: "Blocked", fr: "Bloqué" } },
    needKey: "winter", expiry: "short",
    observed: { en: "Condition of the curb cut or snowbank at the time of the visit; changes quickly.", fr: "État de la descente de bordure ou du banc de neige au moment de la visite ; change rapidement." },
  },
  {
    id: "charging_powerchair", label: { en: "Power chair charging", fr: "Recharge de fauteuil motorisé" }, kind: "boolean", values: bool,
    needKey: "power", expiry: "annual",
    observed: { en: "A socket was offered or signed for chair charging on the visit.", fr: "Une prise était offerte ou indiquée pour recharger un fauteuil lors de la visite." },
  },
];

export const FIELD_IDS: string[] = CATALOG.map((f) => f.id);
