import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { fixturePack, FIXTURE_DAY, placeById } from "../fixtures.js";
import { EQUIPMENT_PROFILE_KEY, readProfile, type EquipmentProfile } from "../profile.js";
import type { Lang } from "../types.js";
import { a11yCss } from "./a11yCss.js";
import { EquipmentProfileForm } from "./EquipmentProfileForm.js";
import { PlacePage } from "./PlacePage.js";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function Harness({ storage, lang = "en" }: { storage: Storage; lang?: Lang }) {
  const [profile, setProfile] = useState<EquipmentProfile | null>(null);
  const place = placeById("fix-community-centre");
  if (!place) return null;
  return (
    <div className="app-ui">
      <style>{a11yCss}</style>
      <main>
        <EquipmentProfileForm lang={lang} storage={storage} onChange={setProfile} />
        <PlacePage
          place={place}
          pack={fixturePack}
          lang={lang}
          today={FIXTURE_DAY}
          corrections={[]}
          changes={[]}
          profile={profile}
          onCorrection={() => undefined}
          onChange={() => undefined}
        />
      </main>
    </div>
  );
}

describe("equipment profile form", () => {
  afterEach(() => {
    cleanup();
  });

  it("saves, edits, and deletes the profile on the device", async () => {
    const storage = memoryStorage();
    const user = userEvent.setup();
    render(<Harness storage={storage} />);
    expect(screen.queryByLabelText("Profile name")).not.toBeInTheDocument();
    expect(screen.getByText("Stored on this device. This does not filter records yet.")).toBeInTheDocument();
    const width = screen.getByLabelText("Chair width for door clearance (mm)");
    await user.type(width, "nope");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(width).toHaveAttribute("aria-invalid", "true");
    const errorId = width.getAttribute("aria-errormessage");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId ?? "")?.textContent).toMatch(/whole number of millimetres/);
    expect(width.getAttribute("aria-describedby")).toContain(errorId ?? "missing");
    await user.clear(width);
    await user.selectOptions(screen.getByLabelText("Chair type"), "power");
    await user.type(width, "900");
    await user.click(screen.getByRole("checkbox", { name: "Step-free required" }));
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Profile saved on this device.")).toBeInTheDocument();
    expect(readProfile(storage)?.chairType).toBe("power");
    expect(screen.getAllByText(/narrower than the saved chair width/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Cannot judge, measurement missing/).length).toBeGreaterThan(0);
    await user.selectOptions(screen.getByLabelText("Chair type"), "scooter");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(readProfile(storage)?.chairType).toBe("scooter");
    await user.click(screen.getByRole("button", { name: "Delete my profile" }));
    expect(screen.getByRole("group", { name: "This deletes the profile saved on this device." })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(readProfile(storage)?.chairType).toBe("scooter");
    await user.click(screen.getByRole("button", { name: "Delete my profile" }));
    expect(screen.getByRole("button", { name: "Delete the saved profile" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(storage.getItem(EQUIPMENT_PROFILE_KEY)).toBeNull();
    expect(readProfile(storage)).toBeNull();
    expect(screen.getByText("Profile deleted from this device.")).toBeInTheDocument();
    expect(screen.queryAllByText(/narrower than the saved chair width/)).toEqual([]);
    expect(screen.queryAllByText(/Cannot judge, measurement missing/)).toEqual([]);
  });

  it("shows the saved status in the current language", async () => {
    const storage = memoryStorage();
    const user = userEvent.setup();
    function LanguageHarness() {
      const [lang, setLang] = useState<Lang>("en");
      return (
        <>
          <button type="button" onClick={() => setLang("fr")}>
            Français
          </button>
          <EquipmentProfileForm lang={lang} storage={storage} onChange={() => undefined} />
        </>
      );
    }
    render(<LanguageHarness />);
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Profile saved on this device.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(screen.getByText("Profil enregistré sur cet appareil.")).toBeInTheDocument();
    expect(screen.queryByText("Profile saved on this device.")).not.toBeInTheDocument();
  });

  it("has no axe violations in English", async () => {
    const storage = memoryStorage();
    document.documentElement.lang = "en";
    document.title = "the App";
    const view = render(<Harness storage={storage} />);
    const results = await axe.run(view.container, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    await userEvent.setup().click(screen.getByRole("button", { name: "Delete my profile" }));
    const confirming = await axe.run(view.container, { rules: { region: { enabled: false } } });
    expect(confirming.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });
});
