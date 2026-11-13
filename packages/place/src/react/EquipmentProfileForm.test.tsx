import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { fixturePack, FIXTURE_DAY, placeById } from "../fixtures.js";
import { EQUIPMENT_PROFILE_KEY, readProfile, type EquipmentProfile } from "../profile.js";
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

function Harness({ storage }: { storage: Storage }) {
  const [profile, setProfile] = useState<EquipmentProfile | null>(null);
  const place = placeById("fix-community-centre");
  if (!place) return null;
  return (
    <div className="app-ui">
      <style>{a11yCss}</style>
      <main>
        <EquipmentProfileForm lang="en" storage={storage} onChange={setProfile} />
        <PlacePage
          place={place}
          pack={fixturePack}
          lang="en"
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
    await user.type(screen.getByLabelText("Profile name"), "Day chair");
    await user.selectOptions(screen.getByLabelText("Chair type"), "power");
    await user.type(screen.getByLabelText("Chair width for door clearance (mm)"), "900");
    await user.click(screen.getByRole("checkbox", { name: "Step-free required" }));
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Profile saved on this device.")).toBeInTheDocument();
    expect(readProfile(storage)?.chairType).toBe("power");
    expect(screen.getAllByText(/Does not meet the saved profile/).length).toBeGreaterThan(0);
    await user.selectOptions(screen.getByLabelText("Chair type"), "scooter");
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(readProfile(storage)?.chairType).toBe("scooter");
    await user.click(screen.getByRole("button", { name: "Delete my profile" }));
    expect(storage.getItem(EQUIPMENT_PROFILE_KEY)).toBeNull();
    expect(readProfile(storage)).toBeNull();
    expect(screen.getByText("Profile deleted from this device.")).toBeInTheDocument();
    expect(screen.getByLabelText("Profile name")).toHaveValue("");
    expect(screen.queryAllByText(/Does not meet the saved profile/)).toEqual([]);
  });

  it("has no axe violations in English", async () => {
    const storage = memoryStorage();
    document.documentElement.lang = "en";
    document.title = "the App";
    const view = render(<Harness storage={storage} />);
    const results = await axe.run(view.container, { rules: { region: { enabled: false } } });
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  });
});
