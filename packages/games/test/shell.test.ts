import { describe, expect, it } from "vitest";
import { CATALOG, GAME_LIBRARY, SHELL_CONTRACT_VERSION, gamesShellModule, listGamesForShell } from "../src/index.js";

const SCOPE_LOCK = [
  "Grid Recall",
  "Pair Sequence",
  "Route Planner",
  "Pattern Rules",
  "Word Roots Builder",
  "Number Compare",
  "Focus Flankers",
  "Switch Rules",
  "Shape Assembly",
  "Order Keeper",
];

describe("games shell adapter", () => {
  it("pins the shell contract version", () => {
    expect(SHELL_CONTRACT_VERSION).toBe("1.1.0");
  });

  it("lists every game in the library by default, the ten scope-lock games first, with no clinical claim and no flashing", async () => {
    const result = await gamesShellModule.list();
    expect(result).toMatchObject({ moduleId: "games", availability: "ready", asOf: null, liveStatus: "unavailable" });
    expect(result.items).toHaveLength(25);
    expect(result.items).toHaveLength(GAME_LIBRARY.length);
    expect(result.items.slice(0, 10).map((item) => item.title).sort()).toEqual([...SCOPE_LOCK].sort());
    for (const item of result.items) {
      expect(item).toEqual({
        id: item.id,
        title: item.title,
        clinicalClaim: false,
        seizureRiskFlash: false,
        keyboardOperable: true,
      });
      expect(item.title).not.toMatch(/lumosity/i);
    }
  });

  it("keeps library ids and order", () => {
    expect(listGamesForShell().items.map((item) => item.id)).toEqual(GAME_LIBRARY.map((game) => game.id));
    expect(new Set(GAME_LIBRARY.map((game) => game.id)).size).toBe(GAME_LIBRARY.length);
  });

  it("lists a shorter catalogue when a host passes one", () => {
    expect(listGamesForShell(CATALOG).items.map((item) => item.id)).toEqual(CATALOG.map((game) => game.id));
  });
});
