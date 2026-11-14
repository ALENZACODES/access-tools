import "@testing-library/jest-dom/vitest";
import { useRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { SwitchBar, switchTargets } from "./SwitchBar.js";

function Sample({ dialogOpen = false }: { dialogOpen?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <SwitchBar rootRef={rootRef} nextLabel="Next" chooseLabel="Choose" help="Switch uses Next, then Choose." />
      <a href="#content">Skip to content</a>
      <button type="button">Save profile</button>
      <button type="button">Delete my profile</button>
      <label>
        Step-free required
        <input type="checkbox" />
      </label>
      <label>
        Door side
        <input type="radio" name="side" />
      </label>
      <label>
        Chair width
        <input type="text" />
      </label>
      <label>
        Chair type
        <select>
          <option>Not set</option>
        </select>
      </label>
      <label>
        Note
        <textarea />
      </label>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- same keyboard scroll stop as a field table */}
      <div tabIndex={0} role="group" className="table-scroll">
        Field table
      </div>
      <dialog open={dialogOpen || undefined}>
        <button type="button">Keep my profile</button>
      </dialog>
    </div>
  );
}

afterEach(() => cleanup());

describe("switch bar", () => {
  it("moves in DOM order with Next and activates with Choose", async () => {
    const user = userEvent.setup();
    const view = render(<Sample />);
    const root = view.container.firstElementChild as HTMLElement;
    expect(switchTargets(root).map((el) => el.tagName)).toEqual(["A", "BUTTON", "BUTTON", "INPUT", "INPUT", "INPUT", "SELECT", "TEXTAREA", "DIV"]);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Skip to content");
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Save profile");
    await user.click(screen.getByRole("button", { name: "Choose" }));
    expect(screen.getByRole("status").textContent).toBe("Save profile");
  });

  it("keeps Next and Choose inside an open dialog", async () => {
    const user = userEvent.setup();
    const view = render(<Sample dialogOpen />);
    const root = view.container.firstElementChild as HTMLElement;
    expect(switchTargets(root).map((el) => el.textContent)).toEqual(["Keep my profile"]);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Keep my profile");
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Keep my profile");
    expect(root.querySelector("[data-switch-current]")?.textContent).not.toBe("Skip to content");
    await user.click(screen.getByRole("button", { name: "Choose" }));
    expect(screen.getByRole("status").textContent).toBe("Keep my profile");
  });

  it("activates every widget type with Choose", async () => {
    const user = userEvent.setup();
    const view = render(<Sample />);
    const root = view.container.firstElementChild as HTMLElement;
    async function choose(target: HTMLElement | undefined): Promise<void> {
      expect(target).toBeTruthy();
      root.querySelectorAll("[data-switch-current]").forEach((node) => node.removeAttribute("data-switch-current"));
      target?.setAttribute("data-switch-current", "true");
      await user.click(screen.getByRole("button", { name: "Choose" }));
    }
    const targets = switchTargets(root);
    await choose(targets.find((el) => el.tagName === "A"));
    await choose(targets.find((el) => el.tagName === "BUTTON"));
    await choose(targets.find((el) => el instanceof HTMLInputElement && el.type === "checkbox"));
    await choose(targets.find((el) => el instanceof HTMLInputElement && el.type === "radio"));
    await choose(targets.find((el) => el instanceof HTMLInputElement && el.type === "text"));
    expect(screen.getByRole("textbox", { name: "Chair width" })).toHaveFocus();
    await choose(targets.find((el) => el instanceof HTMLSelectElement));
    expect(screen.getByRole("combobox", { name: "Chair type" })).toHaveFocus();
    await choose(targets.find((el) => el instanceof HTMLTextAreaElement));
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveFocus();
    await choose(targets.find((el) => el.classList.contains("table-scroll")));
    expect(root.querySelector(".table-scroll")).toHaveFocus();
    expect(screen.getByRole("checkbox", { name: "Step-free required" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Door side" })).toBeChecked();
  });
});
