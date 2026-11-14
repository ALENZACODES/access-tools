import "@testing-library/jest-dom/vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SwitchBar, switchTargets } from "./SwitchBar.js";

function Sample() {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <SwitchBar rootRef={rootRef} nextLabel="Next" chooseLabel="Choose" help="Switch uses Next, then Choose." />
      <button type="button">Save profile</button>
      <button type="button">Delete my profile</button>
      <dialog>
        <button type="button">Hidden until open</button>
      </dialog>
    </div>
  );
}

describe("switch bar", () => {
  it("moves in DOM order with Next and activates with Choose", async () => {
    const user = userEvent.setup();
    const view = render(<Sample />);
    const root = view.container.firstElementChild as HTMLElement;
    expect(switchTargets(root).map((el) => el.textContent)).toEqual(["Save profile", "Delete my profile"]);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Save profile");
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(root.querySelector("[data-switch-current]")?.textContent).toBe("Delete my profile");
    await user.click(screen.getByRole("button", { name: "Choose" }));
    expect(screen.getByRole("status").textContent).toBe("Delete my profile");
  });
});
