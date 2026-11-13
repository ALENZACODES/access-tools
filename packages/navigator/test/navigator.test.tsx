import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  DIRECTORY,
  DIRECTORY_FRAMING,
  DirectoryView,
  NAVIGATOR_NOTES_DATABASE,
  deleteNote,
  emptyNote,
  openNavigatorNotes,
  readNote,
  searchDirectory,
  toggleProgram,
  writeNote,
  type Language,
  type NavigatorNote,
} from "../src/index.js";

const ADVICE = [
  /you qualify if/i,
  /you are eligible/i,
  /you will receive/i,
  /you should apply/i,
  /vous êtes admissible/i,
  /vous recevrez/i,
  /the app recommends/i,
  /endorsed by spinal cord injury ontario/i,
  /partner of the app/i,
];

describe("directory records", () => {
  it("loads real sourced records in every requested category", () => {
    expect(DIRECTORY.length).toBeGreaterThanOrEqual(30);
    for (const category of ["benefits", "funding", "equipment", "employment", "housing", "services"] as const) {
      expect(DIRECTORY.some((record) => record.category === category)).toBe(true);
    }
    for (const record of DIRECTORY) {
      expect(record.notEligibilityAdvice).toBe(true);
      expect(record.schemaVersion).toBe("directory-record-1.0.0");
      expect(record.verificationTier).toBe("administrator_page");
      expect(record.retrievedOn).toBe("2026-11-13");
      expect(record.placeFacts).toBe("none");
      expect(record.officialUrl.startsWith("https://")).toBe(true);
      const blob = JSON.stringify(record);
      for (const pattern of ADVICE) expect(blob).not.toMatch(pattern);
    }
    const odsp = DIRECTORY.find((record) => record.id === "odsp");
    expect(odsp?.figure?.statement.en).toMatch(/\$1,436/);
    expect(odsp?.figure?.statement.en).toMatch(/sponsored-immigrant/);
    expect(odsp?.figure?.statement.en).toMatch(/not a general shelter amount/);
    expect(odsp?.figure?.qualifier.en).toMatch(/not your payment/i);
    expect(DIRECTORY.find((record) => record.id === "home-vehicle-modification")?.summary.en).toMatch(/\$38,000/);
    expect(DIRECTORY.find((record) => record.id === "providence-care")).toBeUndefined();
    expect(DIRECTORY.find((record) => record.id === "march-of-dimes-hvmp")).toBeUndefined();
    expect(DIRECTORY.find((record) => record.id === "call-911")).toBeUndefined();
    expect(DIRECTORY.find((record) => record.id === "health-sciences-north")?.summary.en).toMatch(/does not classify/i);
    expect(DIRECTORY.find((record) => record.id === "scio-public-site")?.summary.en).toMatch(/not an endorsement/i);
  });

  it("searches English and French and filters by category", () => {
    expect(searchDirectory(DIRECTORY, { text: "fauteuil" }).map((record) => record.id)).toContain("assistive-devices-program");
    expect(searchDirectory(DIRECTORY, { text: "1,436" }).map((record) => record.id)).toEqual(["odsp"]);
    const housing = searchDirectory(DIRECTORY, { categories: ["housing"] });
    expect(housing.length).toBeGreaterThan(0);
    expect(housing.every((record) => record.category === "housing")).toBe(true);
    expect(searchDirectory(DIRECTORY, { text: "no-such-program" })).toEqual([]);
  });
});

describe("navigator notes", () => {
  it("stores ids only, in a separate database", async () => {
    expect(NAVIGATOR_NOTES_DATABASE).not.toBe("the-app-games");
    const db = await openNavigatorNotes();
    expect(await readNote(db)).toEqual(emptyNote());
    await writeNote(db, toggleProgram(emptyNote(), "odsp"));
    expect((await readNote(db)).programIds).toEqual(["odsp"]);
    await deleteNote(db);
    expect(await readNote(db)).toEqual(emptyNote());
    await expect(writeNote(db, { programIds: ["odsp"], diagnosis: "x" } as NavigatorNote)).rejects.toThrow(/health|ids only/i);
    db.close();
  });
});

function Harness() {
  const [language, setLanguage] = useState<Language>("en");
  const [note, setNote] = useState(emptyNote());
  return (
    <DirectoryView
      records={DIRECTORY}
      language={language}
      note={note}
      onLanguage={setLanguage}
      onToggle={(id) => setNote((current) => toggleProgram(current, id))}
      onClearNote={() => setNote(emptyNote())}
    />
  );
}

describe("directory screen", () => {
  it("keeps the not-advice notice visible and finds a program from the keyboard", async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("note").textContent).toBe(DIRECTORY_FRAMING.en);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search programs and services"), "Connex");
    const link = screen.getByRole("link", { name: /Official page: ConnexOntario/i });
    link.focus();
    expect(link).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(screen.getByRole("note").textContent).toBe(DIRECTORY_FRAMING.fr);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
