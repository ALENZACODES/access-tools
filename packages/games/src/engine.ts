import { PRACTICE_DONE, ROUND_DONE } from "./boundaries.js";
import { mulberry32, shuffle } from "./rng.js";
import type { Choice, CreateOptions, GameData, GameMeta, GameSession, GameView, Language, TaskFamily } from "./types.js";

const UNTIMED: Record<Language, string> = { en: "Untimed. No clock runs.", fr: "Sans minuterie. Aucune horloge ne tourne." };
const INPUT: Record<Language, string> = {
  en: "Single tap, keyboard, or switch: Next, then Choose. No drag and no typing.",
  fr: "Un toucher, le clavier, ou un contacteur : Suivant, puis Choisir. Aucun glisser et aucune saisie.",
};
const COLOUR: Record<Language, string> = {
  en: "Shape and text labels carry the meaning. Colour is not the only signal.",
  fr: "La forme et le texte portent le sens. La couleur n'est pas le seul signal.",
};

export const TASK_FAMILY_LABEL: Record<TaskFamily, Record<Language, string>> = {
  spatial_recall: { en: "Spatial recall", fr: "Rappel spatial" },
  working_memory_sequence: { en: "Working memory, sequence matching", fr: "Mémoire de travail, suite" },
  planning: { en: "Planning", fr: "Planification" },
  rule_discovery: { en: "Rule discovery", fr: "Découverte de règle" },
  word_roots: { en: "Word roots", fr: "Racines de mots" },
  quantity: { en: "Quantity", fr: "Quantité" },
  selective_attention: { en: "Selective attention", fr: "Attention sélective" },
  task_switching: { en: "Task switching", fr: "Changement de règle" },
  spatial_assembly: { en: "Spatial assembly", fr: "Assemblage spatial" },
  running_inventory: { en: "Running inventory", fr: "Inventaire courant" },
};

function meta(
  id: string,
  name: string,
  taskFamily: TaskFamily,
  summary: Record<Language, string>,
): GameMeta {
  return { id, name, taskFamily, summary, timingNote: UNTIMED, inputNote: INPUT, estimatedMinutes: 3 };
}

export const CATALOG: readonly GameMeta[] = [
  meta("grid-recall", "Grid Recall", "spatial_recall", {
    en: "Remember which cells were marked, then select them after they hide.",
    fr: "Retenir les cases marquées, puis les choisir après qu'elles disparaissent.",
  }),
  meta("pair-sequence", "Pair Sequence", "working_memory_sequence", {
    en: "Decide whether the current symbol matches the one from two steps earlier.",
    fr: "Décider si le symbole actuel correspond à celui d'il y a deux étapes.",
  }),
  meta("route-planner", "Route Planner", "planning", {
    en: "Move across a made-up grid to the far corner within a move budget. Not a real place.",
    fr: "Traverser une grille inventée jusqu'au coin opposé, dans un budget de déplacements. Pas un lieu réel.",
  }),
  meta("pattern-rules", "Pattern Rules", "rule_discovery", {
    en: "Read the examples, choose the rule, then apply it to a new item.",
    fr: "Lire les exemples, choisir la règle, puis l'appliquer à un nouvel élément.",
  }),
  meta("word-roots-builder", "Word Roots Builder", "word_roots", {
    en: "Build a word by choosing a root and an affix from the options.",
    fr: "Construire un mot en choisissant une racine et un affixe parmi les options.",
  }),
  meta("number-compare", "Number Compare", "quantity", {
    en: "Choose the larger quantity. Each one is shown as a number and a bar.",
    fr: "Choisir la plus grande quantité. Chacune est montrée comme un nombre et une barre.",
  }),
  meta("focus-flankers", "Focus Flankers", "selective_attention", {
    en: "Name the direction of the centre arrow. The side arrows are labelled and can be ignored.",
    fr: "Nommer la direction de la flèche du centre. Les flèches des côtés sont étiquetées et peuvent être ignorées.",
  }),
  meta("switch-rules", "Switch Rules", "task_switching", {
    en: "Sort an item by the rule written on the screen. The rule changes and stays visible.",
    fr: "Classer un élément selon la règle écrite à l'écran. La règle change et reste visible.",
  }),
  meta("shape-assembly", "Shape Assembly", "spatial_assembly", {
    en: "Tap a piece, tap Rotate if it needs a turn, then tap the slot where it belongs.",
    fr: "Toucher une pièce, toucher Tourner si elle doit pivoter, puis toucher la case où elle va.",
  }),
  meta("order-keeper", "Order Keeper", "running_inventory", {
    en: "The list stays on screen. After one item arrives or leaves, choose the list that matches.",
    fr: "La liste reste à l'écran. Après l'arrivée ou le départ d'un élément, choisir la liste qui correspond.",
  }),
];

const SHAPE: Record<Language, Record<string, string>> = {
  en: { circle: "circle", square: "square", triangle: "triangle", star: "star" },
  fr: { circle: "cercle", square: "carré", triangle: "triangle", star: "étoile" },
};

const ROOT_TRIALS: Array<{ meaning: Record<Language, string>; answer: string; options: Array<{ id: string; label: string }> }> = [
  {
    meaning: { en: "not happy", fr: "pas content" },
    answer: "un-happy",
    options: [
      { id: "un-happy", label: "un + happy" },
      { id: "re-view", label: "re + view" },
      { id: "pre-pay", label: "pre + pay" },
    ],
  },
  {
    meaning: { en: "view again", fr: "voir de nouveau" },
    answer: "re-view",
    options: [
      { id: "un-happy", label: "un + happy" },
      { id: "re-view", label: "re + view" },
      { id: "pre-view", label: "pre + view" },
    ],
  },
  {
    meaning: { en: "pay before", fr: "payer avant" },
    answer: "pre-pay",
    options: [
      { id: "pre-pay", label: "pre + pay" },
      { id: "re-pay", label: "re + pay" },
      { id: "un-view", label: "un + view" },
    ],
  },
];

const QUANTITIES: Array<{ left: string; right: string; leftBar: number; rightBar: number; answer: "left" | "right" }> = [
  { left: "2", right: "5", leftBar: 2, rightBar: 5, answer: "right" },
  { left: "1/2", right: "1/4", leftBar: 2, rightBar: 1, answer: "left" },
  { left: "3", right: "3", leftBar: 3, rightBar: 3, answer: "left" },
];

const FLANKERS: Array<{ center: "left" | "right"; flank: "left" | "right" }> = [
  { center: "left", flank: "right" },
  { center: "right", flank: "right" },
  { center: "right", flank: "left" },
  { center: "left", flank: "left" },
];

const SWITCH_ITEMS: Array<{ shape: "circle" | "square"; size: "large" | "small"; rule: "circle" | "large" }> = [
  { shape: "circle", size: "small", rule: "circle" },
  { shape: "square", size: "large", rule: "circle" },
  { shape: "square", size: "large", rule: "large" },
  { shape: "circle", size: "small", rule: "large" },
];

const ORDER_STEPS: Array<{ add: string | null; remove: string | null; event: Record<Language, string> }> = [
  { add: "tea", remove: null, event: { en: "Add tea.", fr: "Ajouter thé." } },
  { add: null, remove: "bread", event: { en: "Remove bread.", fr: "Retirer pain." } },
  { add: "apple", remove: null, event: { en: "Add apple.", fr: "Ajouter pomme." } },
];

const BLOCKED = 4;
const GOAL = 8;
const BUDGET = 6;

export function metaById(id: string): GameMeta {
  const found = CATALOG.find((game) => game.id === id);
  if (!found) throw new Error(`Unknown game ${id}`);
  return found;
}

export function createSession(id: string, options: CreateOptions): GameSession {
  metaById(id);
  return {
    metaId: id,
    language: options.language,
    pace: options.pace,
    timerEnabled: false,
    practice: options.practice === true,
    paused: false,
    correct: 0,
    answered: 0,
    done: false,
    data: initialData(id, options.seed),
  };
}

function initialData(id: string, seed: number): GameData {
  const rng = mulberry32(seed);
  switch (id) {
    case "grid-recall":
      return { kind: "grid-recall", lit: shuffle(rng, [0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3).sort((a, b) => a - b), phase: "study", selected: [], replayed: false };
    case "pair-sequence":
      return { kind: "pair-sequence", symbols: Array.from({ length: 6 }, (_, index) => (index === 3 ? "circle" : shuffle(rng, ["circle", "square", "triangle", "star"])[0] ?? "circle")), index: 0 };
    case "route-planner":
      return { kind: "route-planner", position: 0, path: [0], budget: BUDGET };
    case "pattern-rules":
      return { kind: "pattern-rules", step: 0 };
    case "word-roots-builder":
      return { kind: "word-roots", index: 0 };
    case "number-compare":
      return { kind: "number-compare", index: 0 };
    case "focus-flankers":
      return { kind: "focus-flankers", index: 0 };
    case "switch-rules":
      return { kind: "switch-rules", index: 0 };
    case "shape-assembly":
      return { kind: "shape-assembly", selected: null, rotation: 270, placed: [null, null, null] };
    case "order-keeper":
      return { kind: "order-keeper", index: 0, list: ["bread", "milk"] };
    default:
      throw new Error(`Unknown game ${id}`);
  }
}

export function pauseSession(session: GameSession): GameSession {
  if (session.done) return session;
  return { ...session, paused: !session.paused };
}

export function choose(session: GameSession, choiceId: string): GameSession {
  if (session.done) return session;
  if (session.paused) return choiceId === "resume" ? { ...session, paused: false } : session;
  return apply(session, choiceId);
}

/** No clock is wired. Calling this does not change the round. */
export function expireTrial(session: GameSession): GameSession {
  return session;
}

export function viewSession(session: GameSession): GameView {
  const game = metaById(session.metaId);
  const body = describe(session);
  const doneText = session.practice ? PRACTICE_DONE[session.language] : ROUND_DONE[session.language];
  const announcement = session.paused ? (session.language === "fr" ? "Pause." : "Paused.") : session.done ? doneText : body.prompt;
  return {
    gameId: session.metaId,
    title: game.name,
    prompt: body.prompt,
    detail: `${body.detail} ${COLOUR[session.language]}`,
    choices: session.done ? [] : body.choices,
    status: session.done ? "complete" : "playing",
    paused: session.paused,
    announcement,
    correctCount: session.correct,
    trialCount: session.answered,
    points: session.practice ? 0 : session.correct,
    practice: session.practice,
    scoreVisible: session.done && !session.practice,
    timerVisible: false,
  };
}

export function solutionIds(session: GameSession): string[] {
  if (session.done || session.paused) return [];
  const data = session.data;
  switch (data.kind) {
    case "grid-recall":
      if (data.phase === "study") return ["ready"];
      return [...data.lit.filter((cell) => !data.selected.includes(cell)).map(cellId), "check"];
    case "pair-sequence":
      if (data.index < 2) return ["next"];
      return [data.symbols[data.index] === data.symbols[data.index - 2] ? "yes" : "no"];
    case "route-planner":
      return routeSolution(data.position);
    case "pattern-rules":
      return data.step === 0 ? ["rule-filled"] : ["apply-yes"];
    case "word-roots":
      return [ROOT_TRIALS[data.index]?.answer ?? ""];
    case "number-compare":
      return [QUANTITIES[data.index]?.answer ?? "left"];
    case "focus-flankers":
      return [FLANKERS[data.index]?.center ?? "left"];
    case "switch-rules": {
      const item = SWITCH_ITEMS[data.index];
      if (!item) return [];
      const matches = item.rule === "circle" ? item.shape === "circle" : item.size === "large";
      return [matches ? "matches" : "other"];
    }
    case "shape-assembly": {
      const needed = ["triangle", "square", "circle"].find((piece, slot) => data.placed[slot] !== piece);
      if (!needed) return [];
      if (data.selected !== needed) return [`piece-${needed}`];
      if (needed === "triangle" && data.rotation % 360 !== 0) return ["rotate"];
      return [`slot-${["triangle", "square", "circle"].indexOf(needed)}`];
    }
    case "order-keeper":
      return ["correct"];
    default:
      return [];
  }
}

export function playPerfect(session: GameSession): GameSession {
  let current = session;
  for (let guard = 0; guard < 80 && !current.done; guard += 1) {
    const steps = solutionIds(current);
    if (steps.length === 0) break;
    for (const id of steps) {
      if (current.done) break;
      current = choose(current, id);
    }
  }
  return current;
}

function routeSolution(position: number): string[] {
  const path = ["right", "right", "down", "down"];
  const cells = [0, 1, 2, 5, 8];
  const index = cells.indexOf(position);
  const move = path[index];
  return move ? [move] : [];
}

function apply(session: GameSession, choiceId: string): GameSession {
  const data = session.data;
  switch (data.kind) {
    case "grid-recall":
      return applyGrid(session, data, choiceId);
    case "pair-sequence":
      return applyPair(session, data, choiceId);
    case "route-planner":
      return applyRoute(session, data, choiceId);
    case "pattern-rules":
      return applyPattern(session, data, choiceId);
    case "word-roots":
      return applyChoiceList(session, data.index, ROOT_TRIALS.length, choiceId, ROOT_TRIALS[data.index]?.answer ?? "", (index) => ({ kind: "word-roots", index }));
    case "number-compare":
      return applyChoiceList(session, data.index, QUANTITIES.length, choiceId, QUANTITIES[data.index]?.answer ?? "", (index) => ({ kind: "number-compare", index }));
    case "focus-flankers":
      return applyChoiceList(session, data.index, FLANKERS.length, choiceId, FLANKERS[data.index]?.center ?? "", (index) => ({ kind: "focus-flankers", index }));
    case "switch-rules": {
      const item = SWITCH_ITEMS[data.index];
      const expected = item && (item.rule === "circle" ? item.shape === "circle" : item.size === "large") ? "matches" : "other";
      return applyChoiceList(session, data.index, SWITCH_ITEMS.length, choiceId, expected, (index) => ({ kind: "switch-rules", index }));
    }
    case "shape-assembly":
      return applyShape(session, data, choiceId);
    case "order-keeper":
      return applyOrder(session, data, choiceId);
    default:
      return session;
  }
}

function applyGrid(session: GameSession, data: Extract<GameData, { kind: "grid-recall" }>, choiceId: string): GameSession {
  if (choiceId === "ready" && data.phase === "study") return { ...session, data: { ...data, phase: "recall" } };
  if (choiceId === "replay" && data.phase === "recall" && !data.replayed) {
    return { ...session, data: { ...data, phase: "study", replayed: true, selected: [] } };
  }
  if (choiceId.startsWith("cell-") && data.phase === "recall") {
    const cell = Number(choiceId.slice(5));
    const selected = data.selected.includes(cell) ? data.selected.filter((item) => item !== cell) : [...data.selected, cell];
    return { ...session, data: { ...data, selected } };
  }
  if (choiceId === "check" && data.phase === "recall") {
    const hits = data.lit.filter((cell) => data.selected.includes(cell)).length;
    return finish(session, hits, data.lit.length);
  }
  return session;
}

function applyPair(session: GameSession, data: Extract<GameData, { kind: "pair-sequence" }>, choiceId: string): GameSession {
  if (data.index < 2) {
    if (choiceId !== "next") return session;
    return { ...session, data: { ...data, index: data.index + 1 } };
  }
  if (choiceId !== "yes" && choiceId !== "no") return session;
  const expected = data.symbols[data.index] === data.symbols[data.index - 2] ? "yes" : "no";
  const correct = session.correct + (choiceId === expected ? 1 : 0);
  const index = data.index + 1;
  const next = { ...session, correct, answered: session.answered + 1, data: { ...data, index } };
  return index >= data.symbols.length ? { ...next, done: true } : next;
}

function applyRoute(session: GameSession, data: Extract<GameData, { kind: "route-planner" }>, choiceId: string): GameSession {
  if (choiceId === "undo" && data.path.length > 1) {
    const path = data.path.slice(0, -1);
    return { ...session, data: { ...data, path, position: path[path.length - 1] ?? 0 } };
  }
  const moved = neighbor(data.position, choiceId);
  if (moved === null || moved === BLOCKED || data.path.length - 1 >= data.budget) return session;
  const path = [...data.path, moved];
  if (moved === GOAL) return finish({ ...session, data: { ...data, position: moved, path } }, 1, 1);
  return { ...session, data: { ...data, position: moved, path } };
}

function applyPattern(session: GameSession, data: Extract<GameData, { kind: "pattern-rules" }>, choiceId: string): GameSession {
  if (choiceId === "hint") return session;
  if (data.step === 0 && choiceId.startsWith("rule-")) {
    const correct = session.correct + (choiceId === "rule-filled" ? 1 : 0);
    return { ...session, correct, answered: session.answered + 1, data: { kind: "pattern-rules", step: 1 } };
  }
  if (data.step === 1 && (choiceId === "apply-yes" || choiceId === "apply-no")) {
    const correct = session.correct + (choiceId === "apply-yes" ? 1 : 0);
    return finish({ ...session, correct, answered: session.answered + 1 }, correct, session.answered + 1);
  }
  return session;
}

function applyChoiceList(
  session: GameSession,
  index: number,
  length: number,
  choiceId: string,
  expected: string,
  nextData: (index: number) => GameData,
): GameSession {
  if (!expected || choiceId === "hint") return session;
  const correct = session.correct + (choiceId === expected ? 1 : 0);
  const answered = session.answered + 1;
  const following = index + 1;
  if (following >= length) return finish({ ...session, correct, answered }, correct, answered);
  return { ...session, correct, answered, data: nextData(following) };
}

function applyShape(session: GameSession, data: Extract<GameData, { kind: "shape-assembly" }>, choiceId: string): GameSession {
  if (choiceId.startsWith("piece-")) return { ...session, data: { ...data, selected: choiceId.slice(6) } };
  if (choiceId === "rotate" && data.selected === "triangle") {
    return { ...session, data: { ...data, rotation: (data.rotation + 90) % 360 } };
  }
  if (!choiceId.startsWith("slot-") || !data.selected) return session;
  const slot = Number(choiceId.slice(5));
  const targets = ["triangle", "square", "circle"];
  const rotationOk = data.selected !== "triangle" || data.rotation % 360 === 0;
  if (targets[slot] !== data.selected || !rotationOk || data.placed[slot]) return session;
  const placed = [...data.placed];
  placed[slot] = data.selected;
  const filled = placed.every((piece) => piece !== null);
  const next = { ...session, data: { ...data, selected: null, placed } };
  return filled ? finish(next, 3, 3) : next;
}

function applyOrder(session: GameSession, data: Extract<GameData, { kind: "order-keeper" }>, choiceId: string): GameSession {
  const step = ORDER_STEPS[data.index];
  if (!step || (choiceId !== "correct" && choiceId !== "wrong")) return session;
  const correct = session.correct + (choiceId === "correct" ? 1 : 0);
  const answered = session.answered + 1;
  const list = choiceId === "correct" ? nextList(data.list, step) : data.list;
  const index = data.index + 1;
  const next = { ...session, correct, answered, data: { kind: "order-keeper" as const, index, list } };
  return index >= ORDER_STEPS.length ? { ...next, done: true } : next;
}

function nextList(list: string[], step: (typeof ORDER_STEPS)[number]): string[] {
  if (step.remove) return list.filter((item) => item !== step.remove);
  if (step.add) return [...list, step.add];
  return list;
}

function finish(session: GameSession, correct: number, answered: number): GameSession {
  return { ...session, done: true, correct, answered };
}

function neighbor(position: number, direction: string): number | null {
  const row = Math.floor(position / 3);
  const column = position % 3;
  if (direction === "left") return column === 0 ? null : position - 1;
  if (direction === "right") return column === 2 ? null : position + 1;
  if (direction === "up") return row === 0 ? null : position - 3;
  if (direction === "down") return row === 2 ? null : position + 3;
  return null;
}

function cellLabel(language: Language, cell: number, selected: boolean): string {
  const row = Math.floor(cell / 3) + 1;
  const column = (cell % 3) + 1;
  const mark = selected ? (language === "fr" ? ", choisie" : ", selected") : "";
  return language === "fr" ? `Rangée ${row}, colonne ${column}${mark}` : `Row ${row}, column ${column}${mark}`;
}

function describe(session: GameSession): { prompt: string; detail: string; choices: Choice[] } {
  const language = session.language;
  const data = session.data;
  switch (data.kind) {
    case "grid-recall":
      return describeGrid(language, data);
    case "pair-sequence":
      return describePair(language, data);
    case "route-planner":
      return describeRoute(language, data);
    case "pattern-rules":
      return describePattern(language, data);
    case "word-roots":
      return describeRoots(language, data);
    case "number-compare":
      return describeNumbers(language, data);
    case "focus-flankers":
      return describeFlankers(language, data);
    case "switch-rules":
      return describeSwitch(language, data);
    case "shape-assembly":
      return describeShape(language, data);
    case "order-keeper":
      return describeOrder(language, data);
    default:
      return { prompt: "", detail: "", choices: [] };
  }
}

function describeGrid(language: Language, data: Extract<GameData, { kind: "grid-recall" }>): { prompt: string; detail: string; choices: Choice[] } {
  if (data.phase === "study") {
    const marks = data.lit.map((cell) => cellLabel(language, cell, false)).join("; ");
    return {
      prompt: language === "fr" ? `Cases avec une étoile : ${marks}.` : `Cells with a star: ${marks}.`,
      detail: language === "fr" ? "Chaque étoile a aussi le mot étoile." : "Each star also has the word star.",
      choices: [{ id: "ready", label: language === "fr" ? "Cacher le motif" : "Hide the pattern" }],
    };
  }
  const choices = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => ({ id: cellId(cell), label: cellLabel(language, cell, data.selected.includes(cell)) }));
  choices.push({ id: "check", label: language === "fr" ? "Vérifier" : "Check" });
  if (!data.replayed) choices.push({ id: "replay", label: language === "fr" ? "Revoir le motif une fois" : "Replay the pattern once" });
  return {
    prompt: language === "fr" ? "Le motif est caché. Choisissez les cases qui avaient une étoile, puis vérifiez." : "The pattern is hidden. Select the cells that had a star, then check.",
    detail: language === "fr" ? "Vous pouvez revoir le motif une fois." : "You can replay the pattern once.",
    choices,
  };
}

function describePair(language: Language, data: Extract<GameData, { kind: "pair-sequence" }>): { prompt: string; detail: string; choices: Choice[] } {
  const names = SHAPE[language];
  const current = names[data.symbols[data.index] ?? "circle"] ?? "";
  if (data.index < 2) {
    return {
      prompt: language === "fr" ? `Maintenant : ${current}. La question de correspondance commence dans deux étapes.` : `Now: ${current}. The match question starts two steps in.`,
      detail: language === "fr" ? "Le rythme est le vôtre." : "The pace is yours.",
      choices: [{ id: "next", label: language === "fr" ? "Étape suivante" : "Next step" }],
    };
  }
  const earlier = names[data.symbols[data.index - 2] ?? "circle"] ?? "";
  return {
    prompt: language === "fr" ? `Maintenant : ${current}. Deux étapes plus tôt : ${earlier}. Est-ce le même symbole?` : `Now: ${current}. Two steps earlier: ${earlier}. Is it the same symbol?`,
    detail: language === "fr" ? "Oui et Non sont de grandes cibles. Aucune pénalité de temps." : "Yes and No are large targets. There is no time penalty.",
    choices: [
      { id: "yes", label: language === "fr" ? "Oui" : "Yes" },
      { id: "no", label: language === "fr" ? "Non" : "No" },
    ],
  };
}

function describeRoute(language: Language, data: Extract<GameData, { kind: "route-planner" }>): { prompt: string; detail: string; choices: Choice[] } {
  const moves = data.path.length - 1;
  const choices: Choice[] = [];
  for (const direction of ["left", "right", "up", "down"] as const) {
    const next = neighbor(data.position, direction);
    if (next === null || next === BLOCKED || moves >= data.budget) continue;
    const label = { left: language === "fr" ? "Gauche" : "Left", right: language === "fr" ? "Droite" : "Right", up: language === "fr" ? "Haut" : "Up", down: language === "fr" ? "Bas" : "Down" }[direction];
    choices.push({ id: direction, label });
  }
  if (data.path.length > 1) choices.push({ id: "undo", label: language === "fr" ? "Annuler" : "Undo" });
  return {
    prompt: language === "fr"
      ? `Grille inventée, pas un lieu réel. Départ en haut à gauche, but en bas à droite. Centre bloqué. Déplacements : ${moves} sur ${data.budget}.`
      : `Made-up grid, not a real place. Start at the top left, goal at the bottom right. Centre cell blocked. Moves: ${moves} of ${data.budget}.`,
    detail: language === "fr" ? "Touchez une direction. Annuler est toujours offert après un pas." : "Tap a direction. Undo is available after a step.",
    choices,
  };
}

function describePattern(language: Language, data: Extract<GameData, { kind: "pattern-rules" }>): { prompt: string; detail: string; choices: Choice[] } {
  if (data.step === 0) {
    return {
      prompt: language === "fr"
        ? "Exemples qui vont ensemble : étoile pleine, carré plein. Exemple à part : cercle vide."
        : "Examples that belong together: filled star, filled square. Example set apart: open circle.",
      detail: language === "fr" ? "L'indice répète la règle et n'enlève pas de points." : "The hint repeats the rule and does not remove points.",
      choices: [
        { id: "rule-filled", label: language === "fr" ? "Les formes pleines vont ensemble" : "Filled shapes belong together" },
        { id: "rule-star", label: language === "fr" ? "Seules les étoiles vont ensemble" : "Only stars belong together" },
        { id: "rule-circle", label: language === "fr" ? "Seuls les cercles vont ensemble" : "Only circles belong together" },
        { id: "hint", label: language === "fr" ? "Indice : formes pleines" : "Hint: filled shapes" },
      ],
    };
  }
  return {
    prompt: language === "fr" ? "Nouvel élément : carré plein. La règle des formes pleines l'inclut-elle?" : "New item: filled square. Does the filled-shape rule include it?",
    detail: language === "fr" ? "Le mot plein est écrit, pas seulement une couleur." : "The word filled is written, not colour alone.",
    choices: [
      { id: "apply-yes", label: language === "fr" ? "Oui" : "Yes" },
      { id: "apply-no", label: language === "fr" ? "Non" : "No" },
    ],
  };
}

function describeRoots(language: Language, data: Extract<GameData, { kind: "word-roots" }>): { prompt: string; detail: string; choices: Choice[] } {
  const trial = ROOT_TRIALS[data.index];
  return {
    prompt: language === "fr" ? `Construire le sens : ${trial?.meaning.fr ?? ""}.` : `Build the meaning: ${trial?.meaning.en ?? ""}.`,
    detail: language === "fr" ? "Choisissez les parties. Aucune saisie." : "Choose the parts. No typing.",
    choices: (trial?.options ?? []).map((option) => ({ id: option.id, label: option.label })),
  };
}

function describeNumbers(language: Language, data: Extract<GameData, { kind: "number-compare" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = QUANTITIES[data.index];
  const left = item ? `${item.left}, ${language === "fr" ? "barre" : "bar"} ${item.leftBar}` : "";
  const right = item ? `${item.right}, ${language === "fr" ? "barre" : "bar"} ${item.rightBar}` : "";
  const same = item?.left === item?.right;
  return {
    prompt: same
      ? language === "fr" ? `Les deux quantités sont ${left} et ${right}. Choisissez la gauche quand elles sont égales.` : `Both quantities are ${left} and ${right}. Choose the left one when they are equal.`
      : language === "fr" ? `Quelle quantité est plus grande? Gauche : ${left}. Droite : ${right}.` : `Which quantity is larger? Left: ${left}. Right: ${right}.`,
    detail: language === "fr" ? "Le nombre et la barre sont ensemble." : "The number and the bar are shown together.",
    choices: [
      { id: "left", label: language === "fr" ? `Gauche, ${left}` : `Left, ${left}` },
      { id: "right", label: language === "fr" ? `Droite, ${right}` : `Right, ${right}` },
    ],
  };
}

function describeFlankers(language: Language, data: Extract<GameData, { kind: "focus-flankers" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = FLANKERS[data.index];
  const center = item?.center ?? "left";
  const flank = item?.flank ?? "left";
  const word = (value: string) => (language === "fr" ? (value === "left" ? "gauche" : "droite") : value);
  return {
    prompt: language === "fr"
      ? `La flèche du centre pointe ${word(center)} et elle est aussi un triangle ${word(center)}. Les flèches des côtés pointent ${word(flank)} et portent le mot ${word(flank)}.`
      : `The centre arrow points ${word(center)} and is also a ${word(center)} triangle. The side arrows point ${word(flank)} and are labelled ${word(flank)}.`,
    detail: language === "fr" ? "Nommez seulement le centre. Aucune horloge." : "Name only the centre. No clock.",
    choices: [
      { id: "left", label: language === "fr" ? "Le centre pointe à gauche" : "Centre points left" },
      { id: "right", label: language === "fr" ? "Le centre pointe à droite" : "Centre points right" },
    ],
  };
}

function describeSwitch(language: Language, data: Extract<GameData, { kind: "switch-rules" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = SWITCH_ITEMS[data.index];
  const rule = item?.rule === "large"
    ? language === "fr" ? "Règle actuelle, en texte : garder les grands éléments." : "Current rule, as text: keep large items."
    : language === "fr" ? "Règle actuelle, en texte : garder les cercles." : "Current rule, as text: keep circles.";
  const shape = item ? SHAPE[language][item.shape] : "";
  const size = item?.size === "large" ? (language === "fr" ? "grand" : "large") : language === "fr" ? "petit" : "small";
  return {
    prompt: `${rule} ${language === "fr" ? "Élément" : "Item"}: ${size} ${shape}.`,
    detail: language === "fr" ? "La règle reste écrite pendant le choix." : "The rule stays written while you choose.",
    choices: [
      { id: "matches", label: language === "fr" ? "Correspond à la règle" : "Matches the rule" },
      { id: "other", label: language === "fr" ? "Ne correspond pas à la règle" : "Does not match the rule" },
    ],
  };
}

function describeShape(language: Language, data: Extract<GameData, { kind: "shape-assembly" }>): { prompt: string; detail: string; choices: Choice[] } {
  const slots = data.placed.map((piece, index) => piece ?? (language === "fr" ? `case ${index + 1} vide` : `slot ${index + 1} empty`)).join(", ");
  const turn = language === "fr" ? `Triangle tourné de ${data.rotation} degrés.` : `Triangle turned ${data.rotation} degrees.`;
  return {
    prompt: language === "fr"
      ? `But : triangle, carré, cercle. Cases : ${slots}. ${turn}`
      : `Target: triangle, square, circle. Slots: ${slots}. ${turn}`,
    detail: language === "fr" ? "Touchez une pièce, puis une case. Tourner est un bouton, pas un glisser." : "Tap a piece, then a slot. Rotate is a button, not a drag.",
    choices: [
      { id: "piece-triangle", label: language === "fr" ? "Pièce triangle" : "Triangle piece" },
      { id: "piece-square", label: language === "fr" ? "Pièce carré" : "Square piece" },
      { id: "piece-circle", label: language === "fr" ? "Pièce cercle" : "Circle piece" },
      { id: "rotate", label: language === "fr" ? "Tourner le triangle" : "Rotate the triangle" },
      { id: "slot-0", label: language === "fr" ? "Case 1" : "Slot 1" },
      { id: "slot-1", label: language === "fr" ? "Case 2" : "Slot 2" },
      { id: "slot-2", label: language === "fr" ? "Case 3" : "Slot 3" },
    ],
  };
}

function describeOrder(language: Language, data: Extract<GameData, { kind: "order-keeper" }>): { prompt: string; detail: string; choices: Choice[] } {
  const step = ORDER_STEPS[data.index];
  const current = data.list.join(", ");
  const correct = step ? nextList(data.list, step).join(", ") : current;
  const wrong = data.list.slice(0, 1).join(", ") || "empty";
  return {
    prompt: language === "fr"
      ? `Liste visible : ${current}. ${step?.event.fr ?? ""} Quelle liste correspond?`
      : `Visible list: ${current}. ${step?.event.en ?? ""} Which list matches?`,
    detail: language === "fr" ? "La liste reste affichée. Un seul changement." : "The list stays on screen. One change.",
    choices: [
      { id: "correct", label: correct },
      { id: "wrong", label: wrong },
    ],
  };
}

function cellId(cell: number): string {
  return `cell-${cell}`;
}
