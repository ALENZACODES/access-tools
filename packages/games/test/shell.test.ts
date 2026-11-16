import { describe, expect, it } from "vitest";
import { gamesShellModule, listGamesForShell } from "../src/shell.js";

const ctx = { locale: "en" as const, offline: false, nowIso: "2026-11-15T12:00:00.000Z" };

describe("games shell adapter", () => {
  it("lists no activities and stays ready", async () => {
    const result = await gamesShellModule.list(ctx);
    expect(gamesShellModule.id).toBe("games");
    expect(result).toEqual(listGamesForShell(ctx));
    expect(result).toMatchObject({
      moduleId: "games",
      availability: "ready",
      items: [],
      liveStatus: "unavailable",
      asOf: null,
    });
    expect(result.messageKey).toBeTruthy();
  });
});
