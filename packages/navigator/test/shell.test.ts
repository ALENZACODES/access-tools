import { describe, expect, it } from "vitest";
import { listNavigatorForShell, navigatorShellModule } from "../src/shell.js";

const ctx = { locale: "en" as const, offline: false, nowIso: "2026-11-15T12:00:00.000Z" };

describe("navigator shell adapter", () => {
  it("lists no directory entries and stays ready", async () => {
    const result = await navigatorShellModule.list(ctx);
    expect(navigatorShellModule.id).toBe("navigator");
    expect(result).toEqual(listNavigatorForShell(ctx));
    expect(result).toMatchObject({
      moduleId: "navigator",
      availability: "ready",
      items: [],
      liveStatus: "unavailable",
      asOf: null,
    });
    expect(result.messageKey).toBeTruthy();
  });
});
