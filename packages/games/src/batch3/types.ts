import type { GameMeta, Language } from "../types.js";
import type { BatchBody, BatchStep } from "../batch2/types.js";

/** Task families for the third batch of games. Plain descriptions, not commercial categories. */
export type BatchThreeFamily = "counting" | "calendar_order" | "path_following" | "grid_pattern" | "grouping" | "clock_arithmetic";

export interface TallyTrial {
  /** Indexes into the shape list, one per place in the row. */
  row: number[];
  /** The shape to count. */
  target: number;
  answer: number;
  options: number[];
}

export interface DayTrial {
  /** Day of the week, 0 (Monday) to 6 (Sunday). */
  start: number;
  /** Days to move: 2 to 4. */
  distance: number;
  direction: "after" | "before";
  answer: number;
  /** Three different days, the answer among them. */
  options: number[];
}

export interface CompassMove {
  direction: "north" | "south" | "east" | "west";
  steps: number;
}

/** A place on the made-up grid, counted from the start: east is positive, north is positive. */
export type GridPlace = [east: number, north: number];

export interface CompassTrial {
  moves: CompassMove[];
  answer: GridPlace;
  options: GridPlace[];
}

export interface GridCell {
  shape: number;
  size: number;
}

export interface GridTrial {
  /** Shape index for each of the three rows. */
  rowShapes: [number, number, number];
  /** Size index for each of the three columns. */
  columnSizes: [number, number, number];
  /** The cell left out: row and column, 0 to 2. */
  gap: [number, number];
  options: GridCell[];
}

export interface GroupTrial {
  /** Index into the word pool. */
  word: number;
  /** Three different group indexes, the word's own group among them. */
  options: number[];
}

export interface ClockTrial {
  /** Minutes after twelve on a twelve-hour clock, 0 to 719. */
  start: number;
  /** Minutes to add. */
  add: number;
  answer: number;
  options: number[];
}

export type BatchThreeState =
  | { game: "tally-row"; index: number; trials: TallyTrial[] }
  | { game: "day-hop"; index: number; trials: DayTrial[] }
  | { game: "compass-steps"; index: number; trials: CompassTrial[] }
  | { game: "grid-gap"; index: number; trials: GridTrial[] }
  | { game: "group-finder"; index: number; trials: GroupTrial[] }
  | { game: "clock-hop"; index: number; trials: ClockTrial[] };

export type BatchThreeGameId = BatchThreeState["game"];

export interface BatchThreeGame<S extends BatchThreeState = BatchThreeState> {
  meta: GameMeta;
  start(seed: number): S;
  /** Returns null when the choice does nothing in the current state. */
  step(state: S, choiceId: string): BatchStep<S> | null;
  describe(state: S, language: Language): BatchBody;
  /** The next choice or choices that play the round without an error. */
  solution(state: S): string[];
}
