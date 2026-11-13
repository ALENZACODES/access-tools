import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findHardcodedUiCopy } from "./hardcodedEnglishUi.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const COMPONENT_ROOTS = [
  "packages/place/src/react",
  "packages/place/src/demo",
  "packages/search/src/react",
  "packages/search/src/demo",
  "packages/finders/src/react",
  "packages/finders/src/demo",
];

function componentFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...componentFiles(full));
      continue;
    }
    if (entry.endsWith(".tsx") && !entry.endsWith(".test.tsx")) found.push(full);
  }
  return found;
}

function textsOf(source: string): string[] {
  return findHardcodedUiCopy("Sample.tsx", source).map((hit) => hit.text);
}

describe("French language coverage for component copy", () => {
  it("fails when a sample component types English into a label, button, caption, aria-label, or empty state", () => {
    const hits = textsOf(`
      export function Sample({ lang }: { lang: "en" | "fr" }) {
        return (
          <form>
            <label>{lang === "fr" ? "Mot" : "Word"}</label>
            <button type="submit">{lang === "fr" ? "Enregistrer" : "Save"}</button>
            <p role="status">{lang === "fr" ? "Aucun résultat." : "No results."}</p>
            <nav aria-label={lang === "fr" ? "Sections" : "Sections"} />
            <input className="stack" id="q" role="search" />
            <button type="button">{copy("save.button", lang)}</button>
          </form>
        );
      }
    `);
    expect(hits).toContain("Word");
    expect(hits).toContain("Save");
    expect(hits).toContain("No results.");
    expect(hits).toContain("Sections");
    expect(hits).not.toContain("stack");
    expect(hits).not.toContain("search");
    expect(hits).not.toContain("save.button");
  });

  it.each([
    {
      name: "ternary fallback",
      source: `export function Sample({ rows }: { rows: unknown[] }) { return <p>{rows.length ? null : "No results found"}</p>; }`,
      hit: "No results found",
    },
    {
      name: "or fallback",
      source: `export function Sample({ name }: { name: string }) { return <p>{name || "Untitled place"}</p>; }`,
      hit: "Untitled place",
    },
    {
      name: "nullish fallback",
      source: `export function Sample({ name }: { name: string }) { return <p>{name ?? "Untitled place"}</p>; }`,
      hit: "Untitled place",
    },
    {
      name: "module constant used in JSX",
      source: `const MSG = "Nothing matched your search"; export function Sample() { return <p>{MSG}</p>; }`,
      hit: "Nothing matched your search",
    },
    {
      name: "file-level label constant",
      source: `const WORDS = "Words to find"; export function Sample() { return <label>{WORDS}</label>; }`,
      hit: "Words to find",
    },
    {
      name: "language ternary that still types English",
      source: `export function Sample({ lang }: { lang: string }) { const heading = lang ? copy("search.heading", lang) : "Search places"; return <h2>{heading}</h2>; }`,
      hit: "Search places",
    },
    {
      name: "submit value",
      source: `export function Sample() { return <input type="submit" value="Search now" />; }`,
      hit: "Search now",
    },
    {
      name: "custom heading prop",
      source: `export function Sample() { return <Thing heading="Access details" />; }`,
      hit: "Access details",
    },
    {
      name: "sentence with a period",
      source: `export function Sample() { return <p>Saved.</p>; }`,
      hit: "Saved.",
    },
    {
      name: "all-caps word",
      source: `export function Sample() { return <span>NEW</span>; }`,
      hit: "NEW",
    },
    {
      name: "template aria-label",
      source: "export function Sample({ name }: { name: string }) { return <button aria-label={`Open ${name} details`} type=\"button\">Open</button>; }",
      hit: "Open {slot} details",
    },
  ])("fails when English is typed as $name", ({ source, hit }) => {
    expect(textsOf(source)).toContain(hit);
  });

  it("ignores class names, roles, catalogue keys, value enums, comparisons, and units", () => {
    const hits = textsOf(`
      export function Sample({ kind, count }: { kind: string; count: number | null }) {
        return (
          <form>
            <input className="stack" id="q" role="search" />
            <option value="any">{copy("save.button", "en")}</option>
            <a href="tel:911">Call</a>
            <p>{kind === "repair" ? "Shown" : "Hidden"}</p>
            <dd>{count === null ? null : \`\${count} m\`}</dd>
          </form>
        );
      }
    `);
    expect(hits).toContain("Call");
    expect(hits).toContain("Shown");
    expect(hits).toContain("Hidden");
    expect(hits).not.toContain("stack");
    expect(hits).not.toContain("search");
    expect(hits).not.toContain("save.button");
    expect(hits).not.toContain("any");
    expect(hits).not.toContain("repair");
    expect(hits).not.toContain("{slot} m");
    expect(hits).not.toContain("tel:911");
  });

  it("fails when English UI text is typed into a component instead of the i18n catalogue", () => {
    const hits = COMPONENT_ROOTS.flatMap((root) =>
      componentFiles(path.join(repoRoot, root)).flatMap((file) =>
        findHardcodedUiCopy(path.relative(repoRoot, file), readFileSync(file, "utf8")),
      ),
    );
    expect(hits.map((hit) => `${hit.file}:${hit.line} ${hit.text}`)).toEqual([]);
  });
});
