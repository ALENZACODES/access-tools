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

describe("French language coverage for component copy", () => {
  it("fails when a sample component types English into a label, button, caption, aria-label, or empty state", () => {
    const source = `
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
    `;
    const hits = findHardcodedUiCopy("Sample.tsx", source).map((hit) => hit.text);
    expect(hits).toContain("Word");
    expect(hits).toContain("Save");
    expect(hits).toContain("No results.");
    expect(hits).not.toContain("stack");
    expect(hits).not.toContain("search");
    expect(hits).not.toContain("save.button");
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
