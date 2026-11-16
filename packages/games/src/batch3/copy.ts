import type { Language } from "../types.js";

/** English and French strings for the third batch of games. French is a draft. */
export const BATCH_THREE_COPY = {
  "family.counting": { en: "Counting", fr: "Dénombrement" },
  "family.calendar_order": { en: "Days in order", fr: "Jours dans l'ordre" },
  "family.path_following": { en: "Following directions", fr: "Suivre des directions" },
  "family.grid_pattern": { en: "Grid pattern", fr: "Motif en grille" },
  "family.grouping": { en: "Grouping words", fr: "Regrouper des mots" },
  "family.clock_arithmetic": { en: "Clock arithmetic", fr: "Calcul d'heures" },
  "name.tally-row": { en: "Tally Row", fr: "Tally Row" },
  "name.day-hop": { en: "Day Hop", fr: "Day Hop" },
  "name.compass-steps": { en: "Compass Steps", fr: "Compass Steps" },
  "name.grid-gap": { en: "Grid Gap", fr: "Grid Gap" },
  "name.group-finder": { en: "Group Finder", fr: "Group Finder" },
  "name.clock-hop": { en: "Clock Hop", fr: "Clock Hop" },
  "summary.tally-row": {
    en: "A row of shapes is written out in words. Count one kind and choose the number.",
    fr: "Une rangée de formes est écrite en mots. Compter une sorte et choisir le nombre.",
  },
  "summary.day-hop": {
    en: "Start from a day of the week and move a few days forward or back. Choose the day you land on.",
    fr: "Partir d'un jour de la semaine et avancer ou reculer de quelques jours. Choisir le jour d'arrivée.",
  },
  "summary.compass-steps": {
    en: "Follow three written moves on a made-up grid and choose where you end up from the start.",
    fr: "Suivre trois déplacements écrits sur une grille inventée et choisir où l'on arrive par rapport au départ.",
  },
  "summary.grid-gap": {
    en: "A grid of nine shapes is written out with one gap. Choose the shape that fills it.",
    fr: "Une grille de neuf formes est écrite avec un trou. Choisir la forme qui le comble.",
  },
  "summary.group-finder": {
    en: "A word is shown. Choose the group it belongs to.",
    fr: "Un mot est affiché. Choisir le groupe auquel il appartient.",
  },
  "summary.clock-hop": {
    en: "A clock time is written out. Add some minutes and choose the new time.",
    fr: "Une heure est écrite. Ajouter des minutes et choisir la nouvelle heure.",
  },
  "round.of": { en: "Question {n} of {total}.", fr: "Question {n} sur {total}." },
  "shape.circle": { en: "circle", fr: "cercle" },
  "shape.square": { en: "square", fr: "carré" },
  "shape.triangle": { en: "triangle", fr: "triangle" },
  "size.small": { en: "small", fr: "petit" },
  "size.medium": { en: "medium", fr: "moyen" },
  "size.large": { en: "large", fr: "grand" },
  "tally.prompt": {
    en: "{round} The row, in order: {row}. How many times does this shape appear: {shape}?",
    fr: "{round} La rangée, dans l'ordre : {row}. Combien de fois cette forme paraît-elle : {shape}?",
  },
  "tally.detail": {
    en: "The row stays on the screen while you count. Take as long as you like.",
    fr: "La rangée reste à l'écran pendant que vous comptez. Prenez tout le temps voulu.",
  },
  "day.0": { en: "Monday", fr: "lundi" },
  "day.1": { en: "Tuesday", fr: "mardi" },
  "day.2": { en: "Wednesday", fr: "mercredi" },
  "day.3": { en: "Thursday", fr: "jeudi" },
  "day.4": { en: "Friday", fr: "vendredi" },
  "day.5": { en: "Saturday", fr: "samedi" },
  "day.6": { en: "Sunday", fr: "dimanche" },
  "day.prompt.after": {
    en: "{round} Start day: {day}. Which day comes {n} days after it?",
    fr: "{round} Jour de départ : {day}. Quel jour vient {n} jours après?",
  },
  "day.prompt.before": {
    en: "{round} Start day: {day}. Which day comes {n} days before it?",
    fr: "{round} Jour de départ : {day}. Quel jour vient {n} jours avant?",
  },
  "day.detail": {
    en: "The week goes round: after Sunday comes Monday. No clock.",
    fr: "La semaine tourne : après dimanche vient lundi. Aucune horloge.",
  },
  "compass.north": { en: "north", fr: "nord" },
  "compass.south": { en: "south", fr: "sud" },
  "compass.east": { en: "east", fr: "est" },
  "compass.west": { en: "west", fr: "ouest" },
  "compass.move": { en: "{direction} {steps}", fr: "{direction} {steps}" },
  "compass.then": { en: ", then ", fr: ", puis " },
  "compass.prompt": {
    en: "{round} Made-up grid, not a real place. From the start, go {moves}. Where are you, counted from the start?",
    fr: "{round} Grille inventée, pas un lieu réel. Du départ, allez ainsi : {moves}. Où êtes-vous, à partir du départ?",
  },
  "compass.detail": {
    en: "Each number is a count of steps. The moves stay written while you choose.",
    fr: "Chaque nombre est un compte de pas. Les déplacements restent écrits pendant le choix.",
  },
  "compass.at.north": { en: "{n} north", fr: "{n} au nord" },
  "compass.at.south": { en: "{n} south", fr: "{n} au sud" },
  "compass.at.level-ns": { en: "no steps north or south", fr: "aucun pas au nord ni au sud" },
  "compass.at.east": { en: "{n} east", fr: "{n} à l'est" },
  "compass.at.west": { en: "{n} west", fr: "{n} à l'ouest" },
  "compass.at.level-ew": { en: "no steps east or west", fr: "aucun pas à l'est ni à l'ouest" },
  "compass.at": { en: "{ns}, {ew}", fr: "{ns}, {ew}" },
  "grid.cell": { en: "{size} {shape}", fr: "{size} {shape}" },
  "grid.gap": { en: "gap", fr: "trou" },
  "grid.row": { en: "Row {n}: {cells}.", fr: "Rangée {n} : {cells}." },
  "grid.prompt": {
    en: "{round} Each row keeps one shape. Each column keeps one size. {rows} What goes in the gap?",
    fr: "{round} Chaque rangée garde une forme. Chaque colonne garde une taille. {rows} Qu'est-ce qui va dans le trou?",
  },
  "grid.detail": {
    en: "The three rows are read left to right. The grid stays on the screen while you choose.",
    fr: "Les trois rangées se lisent de gauche à droite. La grille reste à l'écran pendant le choix.",
  },
  "group.birds": { en: "Birds", fr: "Oiseaux" },
  "group.tools": { en: "Tools", fr: "Outils" },
  "group.fruit": { en: "Fruit", fr: "Fruits" },
  "group.vehicles": { en: "Vehicles", fr: "Véhicules" },
  "word.loon": { en: "loon", fr: "huard" },
  "word.robin": { en: "robin", fr: "merle" },
  "word.owl": { en: "owl", fr: "hibou" },
  "word.gull": { en: "gull", fr: "goéland" },
  "word.hammer": { en: "hammer", fr: "marteau" },
  "word.wrench": { en: "wrench", fr: "clé à molette" },
  "word.saw": { en: "saw", fr: "scie" },
  "word.pliers": { en: "pliers", fr: "pince" },
  "word.apple": { en: "apple", fr: "pomme" },
  "word.pear": { en: "pear", fr: "poire" },
  "word.plum": { en: "plum", fr: "prune" },
  "word.cherry": { en: "cherry", fr: "cerise" },
  "word.canoe": { en: "canoe", fr: "canot" },
  "word.bus": { en: "bus", fr: "autobus" },
  "word.train": { en: "train", fr: "train" },
  "word.bicycle": { en: "bicycle", fr: "vélo" },
  "group.prompt": {
    en: "{round} The word is: {word}. Which group does it belong to?",
    fr: "{round} Le mot est : {word}. À quel groupe appartient-il?",
  },
  "group.detail": {
    en: "Three groups are listed. One of them fits the word.",
    fr: "Trois groupes sont proposés. L'un d'eux convient au mot.",
  },
  "clock.time": { en: "{hour}:{minute}", fr: "{hour} h {minute}" },
  "clock.prompt": {
    en: "{round} A twelve-hour clock shows {time}. What will it show {n} minutes later?",
    fr: "{round} Une horloge de douze heures indique {time}. Qu'indiquera-t-elle {n} minutes plus tard?",
  },
  "clock.detail": {
    en: "After 12 comes 1. This clock is part of the question. No clock is timing you.",
    fr: "Après 12 vient 1. Cette horloge fait partie de la question. Aucune horloge ne vous minute.",
  },
} as const;

export type BatchThreeCopyKey = keyof typeof BATCH_THREE_COPY;

export function batchThreeCopy(key: BatchThreeCopyKey, language: Language): string {
  return BATCH_THREE_COPY[key][language];
}

export function batchThreePhrase(key: BatchThreeCopyKey, language: Language, values: Record<string, string | number> = {}): string {
  return batchThreeCopy(key, language).replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export function batchThreePair(key: BatchThreeCopyKey): Record<Language, string> {
  return { en: batchThreeCopy(key, "en"), fr: batchThreeCopy(key, "fr") };
}
