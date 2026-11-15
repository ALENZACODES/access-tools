import { describe, expect, it } from "vitest";
import { assertHandoff, phoneHref } from "../src/handoff.js";
import { demonstrationHandoff } from "../src/fixtures.js";

const change = (value: object, update: object) => ({ ...value, ...update });

describe("link-only hand-off validation", () => {
  it("accepts a dated synthetic hand-off with link and call actions", () => {
    expect(() => assertHandoff(demonstrationHandoff)).not.toThrow();
    expect(phoneHref("+1 (555) 010-2000")).toBe("tel:+15550102000");
  });
  it.each(["you are eligible", "You will receive $500", "vous êtes admissible", "vous recevrez une aide"]) (
    "rejects entitlement promise: %s", (copy) => {
      expect(() => assertHandoff(change(demonstrationHandoff, { title: { en: copy, fr: "Test" } }))).toThrow(/promise/);
      expect(() => assertHandoff(change(demonstrationHandoff, { steps: [{ kind: "link", label: { en: copy, fr: "Test" }, url: "https://example.org/" }] }))).toThrow(/promise/);
    },
  );
  it("rejects unsupported actions, insecure links, fabricated tiers and undated records", () => {
    expect(() => assertHandoff(change(demonstrationHandoff, { steps: [{ kind: "decide", label: { en: "OK", fr: "OK" } }] }))).toThrow();
    expect(() => assertHandoff(change(demonstrationHandoff, { steps: [{ kind: "link", label: { en: "OK", fr: "OK" }, url: "javascript:alert(1)" }] }))).toThrow();
    expect(() => assertHandoff(change(demonstrationHandoff, { verificationTier: "VERIFIED" }))).toThrow();
    expect(() => assertHandoff(change(demonstrationHandoff, { checkedOn: "" }))).toThrow();
    expect(() => phoneHref("123;pause=100")).toThrow();
  });
});
