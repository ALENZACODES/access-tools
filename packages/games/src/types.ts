export type Language = "en" | "fr";
export type Pace = "relaxed" | "standard" | "brisk";

/** Task families from the prototype scope lock. These are not commercial training categories. */
export type TaskFamily =
  | "spatial_recall"
  | "working_memory_sequence"
  | "planning"
  | "rule_discovery"
  | "word_roots"
  | "quantity"
  | "selective_attention"
  | "task_switching"
  | "spatial_assembly"
  | "running_inventory";

export interface Choice {
  id: string;
  label: string;
}

export interface GameView {
  gameId: string;
  title: string;
  prompt: string;
  detail: string;
  choices: Choice[];
  status: "playing" | "complete";
  paused: boolean;
  announcement: string;
  correctCount: number;
  trialCount: number;
  points: number;
  practice: boolean;
  scoreVisible: boolean;
  timerVisible: boolean;
}

export interface GameMeta {
  id: string;
  /** Exact scope-lock name. It stays in English in both languages. */
  name: string;
  taskFamily: TaskFamily;
  summary: Record<Language, string>;
  timingNote: Record<Language, string>;
  inputNote: Record<Language, string>;
  estimatedMinutes: number;
}

export interface CreateOptions {
  seed: number;
  pace: Pace;
  language: Language;
  timerEnabled: boolean;
  practice?: boolean;
}

export type GameData =
  | { kind: "grid-recall"; lit: number[]; phase: "study" | "recall"; selected: number[]; replayed: boolean }
  | { kind: "pair-sequence"; symbols: string[]; index: number }
  | { kind: "route-planner"; position: number; path: number[]; budget: number }
  | { kind: "pattern-rules"; step: 0 | 1 }
  | { kind: "word-roots"; index: number }
  | { kind: "number-compare"; index: number }
  | { kind: "focus-flankers"; index: number }
  | { kind: "switch-rules"; index: number }
  | { kind: "shape-assembly"; selected: string | null; rotation: number; placed: Array<string | null> }
  | { kind: "order-keeper"; index: number; list: string[] };

export interface GameSession {
  metaId: string;
  language: Language;
  pace: Pace;
  timerEnabled: boolean;
  practice: boolean;
  paused: boolean;
  correct: number;
  answered: number;
  done: boolean;
  data: GameData;
}

export interface GamesSettings {
  schemaVersion: "games-settings-1.0.0";
  playerId: string;
  language: Language;
  textScale: "default" | "large" | "extra_large";
  contrast: "default" | "high";
  reduceMotion: boolean;
  pace: Pace;
  timerEnabled: boolean;
  favouriteGameIds: string[];
  skippedGameIds: string[];
  streakOptOut: boolean;
}

export interface GamesRound {
  schemaVersion: "games-round-1.0.0";
  roundId: string;
  playerId: string;
  gameId: string;
  pace: Pace;
  timerEnabled: boolean;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  points: number;
  correctCount: number;
  trialCount: number;
}

export type HubFilter = "all" | "favourites" | "short";
