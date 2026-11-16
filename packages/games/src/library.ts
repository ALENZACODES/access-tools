import { BATCH_TWO_CATALOG } from "./batch2/index.js";
import { BATCH_THREE_CATALOG } from "./batch3/index.js";
import { CATALOG } from "./engine.js";
import type { GameMeta } from "./types.js";

/**
 * Every game the hub offers: the first ten, then the second batch, then the third.
 * The hub list, search, filters, Surprise me, and the daily set all read this list.
 */
export const GAME_LIBRARY: readonly GameMeta[] = [...CATALOG, ...BATCH_TWO_CATALOG, ...BATCH_THREE_CATALOG];
