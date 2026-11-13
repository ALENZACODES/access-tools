import { PRACTICE_DONE, ROUND_DONE } from "./boundaries.js";
import { gameCopy, gamePhrase, type GameCopyKey } from "./i18n.js";
import { mulberry32, shuffle } from "./rng.js";
import type { Choice, CreateOptions, GameData, GameMeta, GameSession, GameView, Language, TaskFamily } from "./types.js";

function pair(key: GameCopyKey): Record<Language, string> {
  return { en: gameCopy(key, "en"), fr: gameCopy(key, "fr") };
}

const UNTIMED = pair("note.untimed");
const INPUT = pair("note.input");
const COLOUR = pair("note.colour");

export const TASK_FAMILY_LABEL: Record<TaskFamily, Record<Language, string>> = {
  spatial_recall: pair("family.spatial_recall"),
  working_memory_sequence: pair("family.working_memory_sequence"),
  planning: pair("family.planning"),
  rule_discovery: pair("family.rule_discovery"),
  word_roots: pair("family.word_roots"),
  quantity: pair("family.quantity"),
  selective_attention: pair("family.selective_attention"),
  task_switching: pair("family.task_switching"),
  spatial_assembly: pair("family.spatial_assembly"),
  running_inventory: pair("family.running_inventory"),
};

function meta(
  id: string,
  name: string,
  taskFamily: TaskFamily,
  summary: Record<Language, string>,
): GameMeta {
  return { id, name, taskFamily, summary, timingNote: UNTIMED, inputNote: INPUT, estimatedMinutes: 3 };
}

function named(id: string, nameKey: GameCopyKey, taskFamily: TaskFamily, summaryKey: GameCopyKey): GameMeta {
  return meta(id, gameCopy(nameKey, "en"), taskFamily, pair(summaryKey));
}

export const CATALOG: readonly GameMeta[] = [
  named("grid-recall", "name.grid-recall", "spatial_recall", "summary.grid-recall"),
  named("pair-sequence", "name.pair-sequence", "working_memory_sequence", "summary.pair-sequence"),
  named("route-planner", "name.route-planner", "planning", "summary.route-planner"),
  named("pattern-rules", "name.pattern-rules", "rule_discovery", "summary.pattern-rules"),
  named("word-roots-builder", "name.word-roots-builder", "word_roots", "summary.word-roots-builder"),
  named("number-compare", "name.number-compare", "quantity", "summary.number-compare"),
  named("focus-flankers", "name.focus-flankers", "selective_attention", "summary.focus-flankers"),
  named("switch-rules", "name.switch-rules", "task_switching", "summary.switch-rules"),
  named("shape-assembly", "name.shape-assembly", "spatial_assembly", "summary.shape-assembly"),
  named("order-keeper", "name.order-keeper", "running_inventory", "summary.order-keeper"),
];

function shapeName(language: Language, shape: string): string {
  if (shape === "square") return gameCopy("shape.square", language);
  if (shape === "triangle") return gameCopy("shape.triangle", language);
  if (shape === "star") return gameCopy("shape.star", language);
  return gameCopy("shape.circle", language);
}

const ROOT_TRIALS: Array<{ meaning: GameCopyKey; answer: string; options: Array<{ id: string; label: GameCopyKey }> }> = [
  {
    meaning: "root.meaning.un-happy",
    answer: "un-happy",
    options: [
      { id: "un-happy", label: "root.label.un-happy" },
      { id: "re-view", label: "root.label.re-view" },
      { id: "pre-pay", label: "root.label.pre-pay" },
    ],
  },
  {
    meaning: "root.meaning.re-view",
    answer: "re-view",
    options: [
      { id: "un-happy", label: "root.label.un-happy" },
      { id: "re-view", label: "root.label.re-view" },
      { id: "pre-view", label: "root.label.pre-view" },
    ],
  },
  {
    meaning: "root.meaning.pre-pay",
    answer: "pre-pay",
    options: [
      { id: "pre-pay", label: "root.label.pre-pay" },
      { id: "re-pay", label: "root.label.re-pay" },
      { id: "un-view", label: "root.label.un-view" },
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

const ORDER_STEPS: Array<{ add: string | null; remove: string | null; event: GameCopyKey }> = [
  { add: "tea", remove: null, event: "order.add-tea" },
  { add: null, remove: "bread", event: "order.remove-bread" },
  { add: "apple", remove: null, event: "order.add-apple" },
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
  const announcement = session.paused ? gameCopy("status.paused", session.language) : session.done ? doneText : body.prompt;
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
  const mark = selected ? gameCopy("cell.selected", language) : "";
  return gamePhrase("cell.label", language, { row, column, mark });
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
      prompt: gamePhrase("grid.study.prompt", language, { marks }),
      detail: gameCopy("grid.study.detail", language),
      choices: [{ id: "ready", label: gameCopy("grid.hide", language) }],
    };
  }
  const choices = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => ({ id: cellId(cell), label: cellLabel(language, cell, data.selected.includes(cell)) }));
  choices.push({ id: "check", label: gameCopy("grid.check", language) });
  if (!data.replayed) choices.push({ id: "replay", label: gameCopy("grid.replay", language) });
  return {
    prompt: gameCopy("grid.hidden.prompt", language),
    detail: gameCopy("grid.hidden.detail", language),
    choices,
  };
}

function describePair(language: Language, data: Extract<GameData, { kind: "pair-sequence" }>): { prompt: string; detail: string; choices: Choice[] } {
  const current = shapeName(language, data.symbols[data.index] ?? "circle");
  if (data.index < 2) {
    return {
      prompt: gamePhrase("pair.early.prompt", language, { current }),
      detail: gameCopy("pair.pace", language),
      choices: [{ id: "next", label: gameCopy("pair.next", language) }],
    };
  }
  const earlier = shapeName(language, data.symbols[data.index - 2] ?? "circle");
  return {
    prompt: gamePhrase("pair.match.prompt", language, { current, earlier }),
    detail: gameCopy("pair.match.detail", language),
    choices: [
      { id: "yes", label: gameCopy("pair.yes", language) },
      { id: "no", label: gameCopy("pair.no", language) },
    ],
  };
}

function describeRoute(language: Language, data: Extract<GameData, { kind: "route-planner" }>): { prompt: string; detail: string; choices: Choice[] } {
  const moves = data.path.length - 1;
  const choices: Choice[] = [];
  for (const direction of ["left", "right", "up", "down"] as const) {
    const next = neighbor(data.position, direction);
    if (next === null || next === BLOCKED || moves >= data.budget) continue;
    const label = gameCopy(`route.${direction}`, language);
    choices.push({ id: direction, label });
  }
  if (data.path.length > 1) choices.push({ id: "undo", label: gameCopy("route.undo", language) });
  return {
    prompt: gamePhrase("route.prompt", language, { moves, budget: data.budget }),
    detail: gameCopy("route.detail", language),
    choices,
  };
}

function describePattern(language: Language, data: Extract<GameData, { kind: "pattern-rules" }>): { prompt: string; detail: string; choices: Choice[] } {
  if (data.step === 0) {
    return {
      prompt: gameCopy("pattern.examples", language),
      detail: gameCopy("pattern.detail", language),
      choices: [
        { id: "rule-filled", label: gameCopy("pattern.rule-filled", language) },
        { id: "rule-star", label: gameCopy("pattern.rule-star", language) },
        { id: "rule-circle", label: gameCopy("pattern.rule-circle", language) },
        { id: "hint", label: gameCopy("pattern.hint", language) },
      ],
    };
  }
  return {
    prompt: gameCopy("pattern.new", language),
    detail: gameCopy("pattern.new.detail", language),
    choices: [
      { id: "apply-yes", label: gameCopy("pair.yes", language) },
      { id: "apply-no", label: gameCopy("pair.no", language) },
    ],
  };
}

function describeRoots(language: Language, data: Extract<GameData, { kind: "word-roots" }>): { prompt: string; detail: string; choices: Choice[] } {
  const trial = ROOT_TRIALS[data.index];
  return {
    prompt: gamePhrase("roots.prompt", language, { meaning: trial ? gameCopy(trial.meaning, language) : "" }),
    detail: gameCopy("roots.detail", language),
    choices: (trial?.options ?? []).map((option) => ({ id: option.id, label: gameCopy(option.label, language) })),
  };
}

function describeNumbers(language: Language, data: Extract<GameData, { kind: "number-compare" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = QUANTITIES[data.index];
  const bar = gameCopy("numbers.bar", language);
  const left = item ? `${item.left}, ${bar} ${item.leftBar}` : "";
  const right = item ? `${item.right}, ${bar} ${item.rightBar}` : "";
  const same = item?.left === item?.right;
  return {
    prompt: same
      ? gamePhrase("numbers.same", language, { left, right })
      : gamePhrase("numbers.which", language, { left, right }),
    detail: gameCopy("numbers.detail", language),
    choices: [
      { id: "left", label: gamePhrase("numbers.left", language, { value: left }) },
      { id: "right", label: gamePhrase("numbers.right", language, { value: right }) },
    ],
  };
}

function describeFlankers(language: Language, data: Extract<GameData, { kind: "focus-flankers" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = FLANKERS[data.index];
  const center = item?.center ?? "left";
  const flank = item?.flank ?? "left";
  const word = (value: "left" | "right") => gameCopy(value === "left" ? "dir.left" : "dir.right", language);
  return {
    prompt: gamePhrase("flankers.prompt", language, { center: word(center), flank: word(flank) }),
    detail: gameCopy("flankers.detail", language),
    choices: [
      { id: "left", label: gameCopy("flankers.left", language) },
      { id: "right", label: gameCopy("flankers.right", language) },
    ],
  };
}

function describeSwitch(language: Language, data: Extract<GameData, { kind: "switch-rules" }>): { prompt: string; detail: string; choices: Choice[] } {
  const item = SWITCH_ITEMS[data.index];
  const rule = gameCopy(item?.rule === "large" ? "switch.rule-large" : "switch.rule-circles", language);
  const shape = item ? shapeName(language, item.shape) : "";
  const size = gameCopy(item?.size === "large" ? "switch.size-large" : "switch.size-small", language);
  return {
    prompt: `${rule} ${gameCopy("switch.item", language)}${gameCopy("sep.colon", language)}${size} ${shape}.`,
    detail: gameCopy("switch.detail", language),
    choices: [
      { id: "matches", label: gameCopy("switch.matches", language) },
      { id: "other", label: gameCopy("switch.other", language) },
    ],
  };
}

function describeShape(language: Language, data: Extract<GameData, { kind: "shape-assembly" }>): { prompt: string; detail: string; choices: Choice[] } {
  const slots = data.placed.map((piece, index) => piece ?? gamePhrase("shape.slot-empty", language, { n: index + 1 })).join(", ");
  const turn = gamePhrase("shape.turn", language, { degrees: data.rotation });
  return {
    prompt: gamePhrase("shape.prompt", language, { slots, turn }),
    detail: gameCopy("shape.detail", language),
    choices: [
      { id: "piece-triangle", label: gameCopy("shape.piece-triangle", language) },
      { id: "piece-square", label: gameCopy("shape.piece-square", language) },
      { id: "piece-circle", label: gameCopy("shape.piece-circle", language) },
      { id: "rotate", label: gameCopy("shape.rotate", language) },
      { id: "slot-0", label: gameCopy("shape.slot-1", language) },
      { id: "slot-1", label: gameCopy("shape.slot-2", language) },
      { id: "slot-2", label: gameCopy("shape.slot-3", language) },
    ],
  };
}

function describeOrder(language: Language, data: Extract<GameData, { kind: "order-keeper" }>): { prompt: string; detail: string; choices: Choice[] } {
  const step = ORDER_STEPS[data.index];
  const current = data.list.join(", ");
  const correct = step ? nextList(data.list, step).join(", ") : current;
  const wrong = data.list.slice(0, 1).join(", ") || "empty";
  return {
    prompt: gamePhrase("order.prompt", language, { current, event: step ? gameCopy(step.event, language) : "" }),
    detail: gameCopy("order.detail", language),
    choices: [
      { id: "correct", label: correct },
      { id: "wrong", label: wrong },
    ],
  };
}

function cellId(cell: number): string {
  return `cell-${cell}`;
}
