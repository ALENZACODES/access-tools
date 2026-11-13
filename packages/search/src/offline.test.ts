import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { fixturePack } from "@access-tools/place";
import { loadPackOffline, savePackOffline } from "./offline.js";
import { emptySearchQuery, searchPack } from "./search.js";

describe("offline pack", () => {
  it("saves and loads the pack without a network", async () => {
    await savePackOffline(fixturePack);
    const loaded = await loadPackOffline();
    expect(loaded?.id).toBe(fixturePack.id);
    const query = emptySearchQuery("en");
    query.text = "library";
    expect(searchPack(loaded ?? fixturePack, query).hits[0]?.placeId).toBe("fix-library-charging");
  });
});
