export type Language = "en" | "fr";
export type Pace = "relaxed" | "standard" | "brisk";
export type Area =
  | "speed"
  | "memory"
  | "attention"
  | "flexibility"
  | "language"
  | "math"
  | "problem_solving"
  | "wellbeing";

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
  timerVisible: boolean;
}

export interface GameMeta {
  id: string;
  area: Area;
  title: Record<Language, string>;
  summary: Record<Language, string>;
  estimatedMinutes: number;
  calm: boolean;
  short: boolean;
  words: boolean;
  numbers: boolean;
  puzzle: boolean;
}

export interface CreateOptions {
  seed: number;
  pace: Pace;
  language: Language;
  timerEnabled: boolean;
}

export interface GameSession {
  metaId: string;
  language: Language;
  pace: Pace;
  timerEnabled: boolean;
  paused: boolean;
  correct: number;
  answered: number;
  done: boolean;
  data: Record<string, unknown>;
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

export type HubFilter = "all" | "favourites" | "short" | "calm" | "words" | "numbers" | "puzzles";
