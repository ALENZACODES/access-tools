import type { Language } from "./types.js";

export const GAME_COPY = {
  "sep.colon": { en: ": ", fr: "\u00A0: " },
  "status.paused": { en: "Paused.", fr: "Pause." },
  "note.untimed": { en: "Untimed. No clock runs.", fr: "Sans minuterie. Aucune horloge ne tourne." },
  "note.input": {
    en: "Single tap, keyboard, or switch: Next, then Choose. No drag and no typing.",
    fr: "Un toucher, le clavier, ou un contacteur\u00A0: Suivant, puis Choisir. Aucun glisser et aucune saisie.",
  },
  "note.colour": {
    en: "Shape and text labels carry the meaning. Colour is not the only signal.",
    fr: "La forme et le texte portent le sens. La couleur n'est pas le seul signal.",
  },
  "boundary.games": {
    en: "These exercises are for enjoyment and practice. Scores measure performance inside the exercise only. The App does not provide medical advice.",
    fr: "Ces exercices sont pour le plaisir et la pratique. Les pointages mesurent seulement le résultat dans l'exercice. L'application ne donne pas d'avis médical.",
  },
  "boundary.round-done": {
    en: "Round finished. You can stop here. Nothing else in the App changes.",
    fr: "Manche terminée. Vous pouvez vous arrêter ici. Rien d'autre dans l'application ne change.",
  },
  "boundary.practice-done": {
    en: "Practice finished. No score is kept and no record changes.",
    fr: "Pratique terminée. Aucun pointage n'est gardé et aucun dossier ne change.",
  },
  "boundary.practice": {
    en: "Practice. No score is shown, and this round is not saved.",
    fr: "Pratique. Aucun pointage n'est affiché, et cette manche n'est pas enregistrée.",
  },
  "boundary.daily": {
    en: "A suggestion for enjoyment and practice, not a prescription. The same date shows the same three games.",
    fr: "Une suggestion pour le plaisir et la pratique, pas une prescription. La même date montre les trois mêmes jeux.",
  },
  "boundary.grace": {
    en: "Two missed days do not break the streak. A third missed day starts it over. The count stays on this device.",
    fr: "Deux jours manqués ne brisent pas la série. Un troisième jour manqué la recommence. Le compte reste sur cet appareil.",
  },
  "family.spatial_recall": { en: "Spatial recall", fr: "Rappel spatial" },
  "family.working_memory_sequence": { en: "Working memory, sequence matching", fr: "Mémoire de travail, suite" },
  "family.planning": { en: "Planning", fr: "Planification" },
  "family.rule_discovery": { en: "Rule discovery", fr: "Découverte de règle" },
  "family.word_roots": { en: "Word roots", fr: "Racines de mots" },
  "family.quantity": { en: "Quantity", fr: "Quantité" },
  "family.selective_attention": { en: "Selective attention", fr: "Attention sélective" },
  "family.task_switching": { en: "Task switching", fr: "Changement de règle" },
  "family.spatial_assembly": { en: "Spatial assembly", fr: "Assemblage spatial" },
  "family.running_inventory": { en: "Running inventory", fr: "Inventaire courant" },
  "name.grid-recall": { en: "Grid Recall", fr: "Grid Recall" },
  "name.pair-sequence": { en: "Pair Sequence", fr: "Pair Sequence" },
  "name.route-planner": { en: "Route Planner", fr: "Route Planner" },
  "name.pattern-rules": { en: "Pattern Rules", fr: "Pattern Rules" },
  "name.word-roots-builder": { en: "Word Roots Builder", fr: "Word Roots Builder" },
  "name.number-compare": { en: "Number Compare", fr: "Number Compare" },
  "name.focus-flankers": { en: "Focus Flankers", fr: "Focus Flankers" },
  "name.switch-rules": { en: "Switch Rules", fr: "Switch Rules" },
  "name.shape-assembly": { en: "Shape Assembly", fr: "Shape Assembly" },
  "name.order-keeper": { en: "Order Keeper", fr: "Order Keeper" },
  "summary.grid-recall": {
    en: "Remember which cells were marked, then select them after they hide.",
    fr: "Retenir les cases marquées, puis les choisir après qu'elles disparaissent.",
  },
  "summary.pair-sequence": {
    en: "Decide whether the current symbol matches the one from two steps earlier.",
    fr: "Décider si le symbole actuel correspond à celui d'il y a deux étapes.",
  },
  "summary.route-planner": {
    en: "Move across a made-up grid to the far corner within a move budget. Not a real place.",
    fr: "Traverser une grille inventée jusqu'au coin opposé, dans un budget de déplacements. Pas un lieu réel.",
  },
  "summary.pattern-rules": {
    en: "Read the examples, choose the rule, then apply it to a new item.",
    fr: "Lire les exemples, choisir la règle, puis l'appliquer à un nouvel élément.",
  },
  "summary.word-roots-builder": {
    en: "Build a word by choosing a root and an affix from the options.",
    fr: "Construire un mot en choisissant une racine et un affixe parmi les options.",
  },
  "summary.number-compare": {
    en: "Choose the larger quantity. Each one is shown as a number and a bar.",
    fr: "Choisir la plus grande quantité. Chacune est montrée comme un nombre et une barre.",
  },
  "summary.focus-flankers": {
    en: "Name the direction of the centre arrow. The side arrows are labelled and can be ignored.",
    fr: "Nommer la direction de la flèche du centre. Les flèches des côtés sont étiquetées et peuvent être ignorées.",
  },
  "summary.switch-rules": {
    en: "Sort an item by the rule written on the screen. The rule changes and stays visible.",
    fr: "Classer un élément selon la règle écrite à l'écran. La règle change et reste visible.",
  },
  "summary.shape-assembly": {
    en: "Tap a piece, tap Rotate if it needs a turn, then tap the slot where it belongs.",
    fr: "Toucher une pièce, toucher Tourner si elle doit pivoter, puis toucher la case où elle va.",
  },
  "summary.order-keeper": {
    en: "The list stays on screen. After one item arrives or leaves, choose the list that matches.",
    fr: "La liste reste à l'écran. Après l'arrivée ou le départ d'un élément, choisir la liste qui correspond.",
  },
  "shape.circle": { en: "circle", fr: "cercle" },
  "shape.square": { en: "square", fr: "carré" },
  "shape.triangle": { en: "triangle", fr: "triangle" },
  "shape.star": { en: "star", fr: "étoile" },
  "root.meaning.un-happy": { en: "not happy", fr: "pas content" },
  "root.meaning.re-view": { en: "view again", fr: "voir de nouveau" },
  "root.meaning.pre-pay": { en: "pay before", fr: "payer avant" },
  "root.label.un-happy": { en: "un + happy", fr: "un + happy" },
  "root.label.re-view": { en: "re + view", fr: "re + view" },
  "root.label.pre-pay": { en: "pre + pay", fr: "pre + pay" },
  "root.label.pre-view": { en: "pre + view", fr: "pre + view" },
  "root.label.re-pay": { en: "re + pay", fr: "re + pay" },
  "root.label.un-view": { en: "un + view", fr: "un + view" },
  "order.add-tea": { en: "Add tea.", fr: "Ajouter thé." },
  "order.remove-bread": { en: "Remove bread.", fr: "Retirer pain." },
  "order.add-apple": { en: "Add apple.", fr: "Ajouter pomme." },
  "cell.label": { en: "Row {row}, column {column}{mark}", fr: "Rangée {row}, colonne {column}{mark}" },
  "cell.selected": { en: ", selected", fr: ", choisie" },
  "grid.study.prompt": { en: "Cells with a star: {marks}.", fr: "Cases avec une étoile\u00A0: {marks}." },
  "grid.study.detail": { en: "Each star also has the word star.", fr: "Chaque étoile a aussi le mot étoile." },
  "grid.hide": { en: "Hide the pattern", fr: "Cacher le motif" },
  "grid.check": { en: "Check", fr: "Vérifier" },
  "grid.replay": { en: "Replay the pattern once", fr: "Revoir le motif une fois" },
  "grid.hidden.prompt": {
    en: "The pattern is hidden. Select the cells that had a star, then check.",
    fr: "Le motif est caché. Choisissez les cases qui avaient une étoile, puis vérifiez.",
  },
  "grid.hidden.detail": { en: "You can replay the pattern once.", fr: "Vous pouvez revoir le motif une fois." },
  "pair.early.prompt": {
    en: "Now: {current}. The match question starts two steps in.",
    fr: "Maintenant\u00A0: {current}. La question de correspondance commence dans deux étapes.",
  },
  "pair.pace": { en: "The pace is yours.", fr: "Le rythme est le vôtre." },
  "pair.next": { en: "Next step", fr: "Étape suivante" },
  "pair.match.prompt": {
    en: "Now: {current}. Two steps earlier: {earlier}. Is it the same symbol?",
    fr: "Maintenant\u00A0: {current}. Deux étapes plus tôt\u00A0: {earlier}. Est-ce le même symbole?",
  },
  "pair.match.detail": {
    en: "Yes and No are large targets. There is no time penalty.",
    fr: "Oui et Non sont de grandes cibles. Aucune pénalité de temps.",
  },
  "pair.yes": { en: "Yes", fr: "Oui" },
  "pair.no": { en: "No", fr: "Non" },
  "route.left": { en: "Left", fr: "Gauche" },
  "route.right": { en: "Right", fr: "Droite" },
  "route.up": { en: "Up", fr: "Haut" },
  "route.down": { en: "Down", fr: "Bas" },
  "route.undo": { en: "Undo", fr: "Annuler" },
  "route.prompt": {
    en: "Made-up grid, not a real place. Start at the top left, goal at the bottom right. Centre cell blocked. Moves: {moves} of {budget}.",
    fr: "Grille inventée, pas un lieu réel. Départ en haut à gauche, but en bas à droite. Centre bloqué. Déplacements\u00A0: {moves} sur {budget}.",
  },
  "route.detail": {
    en: "Tap a direction. Undo is available after a step.",
    fr: "Touchez une direction. Annuler est toujours offert après un pas.",
  },
  "pattern.examples": {
    en: "Examples that belong together: filled star, filled square. Example set apart: open circle.",
    fr: "Exemples qui vont ensemble\u00A0: étoile pleine, carré plein. Exemple à part\u00A0: cercle vide.",
  },
  "pattern.detail": {
    en: "The hint repeats the rule and does not remove points.",
    fr: "L'indice répète la règle et n'enlève pas de points.",
  },
  "pattern.rule-filled": { en: "Filled shapes belong together", fr: "Les formes pleines vont ensemble" },
  "pattern.rule-star": { en: "Only stars belong together", fr: "Seules les étoiles vont ensemble" },
  "pattern.rule-circle": { en: "Only circles belong together", fr: "Seuls les cercles vont ensemble" },
  "pattern.hint": { en: "Hint: filled shapes", fr: "Indice\u00A0: formes pleines" },
  "pattern.new": {
    en: "New item: filled square. Does the filled-shape rule include it?",
    fr: "Nouvel élément\u00A0: carré plein. La règle des formes pleines l'inclut-elle?",
  },
  "pattern.new.detail": {
    en: "The word filled is written, not colour alone.",
    fr: "Le mot plein est écrit, pas seulement une couleur.",
  },
  "roots.prompt": { en: "Build the meaning: {meaning}.", fr: "Construire le sens\u00A0: {meaning}." },
  "roots.detail": { en: "Choose the parts. No typing.", fr: "Choisissez les parties. Aucune saisie." },
  "numbers.bar": { en: "bar", fr: "barre" },
  "numbers.same": {
    en: "Both quantities are {left} and {right}. Choose the left one when they are equal.",
    fr: "Les deux quantités sont {left} et {right}. Choisissez la gauche quand elles sont égales.",
  },
  "numbers.which": {
    en: "Which quantity is larger? Left: {left}. Right: {right}.",
    fr: "Quelle quantité est plus grande? Gauche\u00A0: {left}. Droite\u00A0: {right}.",
  },
  "numbers.detail": { en: "The number and the bar are shown together.", fr: "Le nombre et la barre sont ensemble." },
  "numbers.left": { en: "Left, {value}", fr: "Gauche, {value}" },
  "numbers.right": { en: "Right, {value}", fr: "Droite, {value}" },
  "dir.left": { en: "left", fr: "gauche" },
  "dir.right": { en: "right", fr: "droite" },
  "flankers.prompt": {
    en: "The centre arrow points {center} and is also a {center} triangle. The side arrows point {flank} and are labelled {flank}.",
    fr: "La flèche du centre pointe {center} et elle est aussi un triangle {center}. Les flèches des côtés pointent {flank} et portent le mot {flank}.",
  },
  "flankers.detail": { en: "Name only the centre. No clock.", fr: "Nommez seulement le centre. Aucune horloge." },
  "flankers.left": { en: "Centre points left", fr: "Le centre pointe à gauche" },
  "flankers.right": { en: "Centre points right", fr: "Le centre pointe à droite" },
  "switch.rule-large": {
    en: "Current rule, as text: keep large items.",
    fr: "Règle actuelle, en texte\u00A0: garder les grands éléments.",
  },
  "switch.rule-circles": {
    en: "Current rule, as text: keep circles.",
    fr: "Règle actuelle, en texte\u00A0: garder les cercles.",
  },
  "switch.size-large": { en: "large", fr: "grand" },
  "switch.size-small": { en: "small", fr: "petit" },
  "switch.item": { en: "Item", fr: "Élément" },
  "switch.detail": { en: "The rule stays written while you choose.", fr: "La règle reste écrite pendant le choix." },
  "switch.matches": { en: "Matches the rule", fr: "Correspond à la règle" },
  "switch.other": { en: "Does not match the rule", fr: "Ne correspond pas à la règle" },
  "shape.slot-empty": { en: "slot {n} empty", fr: "case {n} vide" },
  "shape.turn": { en: "Triangle turned {degrees} degrees.", fr: "Triangle tourné de {degrees} degrés." },
  "shape.prompt": {
    en: "Target: triangle, square, circle. Slots: {slots}. {turn}",
    fr: "But\u00A0: triangle, carré, cercle. Cases\u00A0: {slots}. {turn}",
  },
  "shape.detail": {
    en: "Tap a piece, then a slot. Rotate is a button, not a drag.",
    fr: "Touchez une pièce, puis une case. Tourner est un bouton, pas un glisser.",
  },
  "shape.piece-triangle": { en: "Triangle piece", fr: "Pièce triangle" },
  "shape.piece-square": { en: "Square piece", fr: "Pièce carré" },
  "shape.piece-circle": { en: "Circle piece", fr: "Pièce cercle" },
  "shape.rotate": { en: "Rotate the triangle", fr: "Tourner le triangle" },
  "shape.slot-1": { en: "Slot 1", fr: "Case 1" },
  "shape.slot-2": { en: "Slot 2", fr: "Case 2" },
  "shape.slot-3": { en: "Slot 3", fr: "Case 3" },
  "order.prompt": {
    en: "Visible list: {current}. {event} Which list matches?",
    fr: "Liste visible\u00A0: {current}. {event} Quelle liste correspond?",
  },
  "order.detail": { en: "The list stays on screen. One change.", fr: "La liste reste affichée. Un seul changement." },
  "ui.games": { en: "Games", fr: "Jeux" },
  "ui.daily": { en: "Three games for today", fr: "Trois jeux pour aujourd'hui" },
  "ui.replay": { en: "Replay today's three", fr: "Rejouer les trois d'aujourd'hui" },
  "ui.replay-note": { en: "Same three games for this date. Play any of them again.", fr: "Les trois mêmes jeux pour cette date. Vous pouvez les rejouer." },
  "ui.streak": { en: "Streak", fr: "Série" },
  "ui.streak-count": { en: "Days in a row", fr: "Jours de suite" },
  "ui.grace-left": { en: "Grace days remaining", fr: "Jours de grâce restants" },
  "ui.reset-streak": { en: "Reset the streak on this device", fr: "Remettre la série à zéro sur cet appareil" },
  "ui.search": { en: "Search games", fr: "Chercher un jeu" },
  "ui.filters": { en: "Filters", fr: "Filtres" },
  "ui.surprise": { en: "Surprise me", fr: "Surprenez-moi" },
  "ui.play": { en: "Play", fr: "Jouer" },
  "ui.practice": { en: "Practice", fr: "Pratiquer" },
  "ui.names-english": { en: "Game names stay in English in this prototype.", fr: "Les noms des jeux restent en anglais dans cette version." },
  "ui.switch-help": {
    en: "Switch: Next, then Choose. Single tap and the keyboard work on every button. There is no running scan.",
    fr: "Contacteur\u00A0: Suivant, puis Choisir. Un seul toucher et le clavier fonctionnent sur chaque bouton. Aucun balayage automatique.",
  },
  "ui.settings": { en: "Settings", fr: "Réglages" },
  "ui.hide-streak": { en: "Hide the streak", fr: "Masquer la série" },
  "ui.text": { en: "Text size", fr: "Taille du texte" },
  "ui.text-default": { en: "Default", fr: "Par défaut" },
  "ui.text-large": { en: "Large", fr: "Grand" },
  "ui.text-extra": { en: "Extra large", fr: "Très grand" },
  "ui.next": { en: "Next", fr: "Suivant" },
  "ui.choose": { en: "Choose", fr: "Choisir" },
  "ui.pause": { en: "Pause", fr: "Pause" },
  "ui.resume": { en: "Resume", fr: "Reprendre" },
  "ui.back": { en: "Back to games", fr: "Retour aux jeux" },
  "ui.points": { en: "Points inside this exercise", fr: "Points dans cet exercice" },
  "ui.inside-only": { en: "These numbers measure this exercise only.", fr: "Ces nombres mesurent seulement cet exercice." },
  "ui.filter-all": { en: "All games", fr: "Tous les jeux" },
  "ui.filter-favourites": { en: "My favourites", fr: "Mes favoris" },
  "ui.filter-short": { en: "Short games", fr: "Jeux courts" },
  "lang.show-french": { en: "Français", fr: "Français" },
  "lang.show-english": { en: "English", fr: "English" },
} as const;

export type GameCopyKey = keyof typeof GAME_COPY;

export function gameCopy(key: GameCopyKey, language: Language): string {
  const row = GAME_COPY[key];
  return language === "fr" ? row.fr : row.en;
}

export function gamePhrase(key: GameCopyKey, language: Language, values: Record<string, string | number> = {}): string {
  return gameCopy(key, language).replace(/\{([A-Za-z0-9_]+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

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
