import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { EMERGENCY_PATHWAYS, TIMING_BOUNDARY, TimingPanel } from "../src/index.js";

function Harness() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  return <TimingPanel language={language} onLanguage={setLanguage} />;
}

describe("emergency pathways", () => {
  it("keeps call and text as separate links", () => {
    expect(EMERGENCY_PATHWAYS.map((pathway) => pathway.id)).toEqual([
      "call-911",
      "suicide-crisis-helpline-988",
      "connexontario",
    ]);
    const helpline = EMERGENCY_PATHWAYS[1];
    expect(helpline?.href).toBe("tel:988");
    expect(helpline?.action.en).toBe("Call 9-8-8");
    expect(helpline?.textHref).toBe("sms:988");
    expect(helpline?.textAction?.en).toBe("Text 9-8-8 Suicide Crisis Helpline");
    expect(helpline?.textAction?.fr).toBe("Texter le 9-8-8 Ligne d'aide en cas de crise de suicide");
    const connex = EMERGENCY_PATHWAYS[2];
    expect(connex?.href).toBe("tel:+18665312600");
    expect(connex?.textHref).toBe("sms:247247?body=CONNEX");
    expect(connex?.textAction?.en).toBe("Text CONNEX to 247247");
    expect(connex?.textAction?.fr).toBe("Texter CONNEX au 247247");
    const labels = EMERGENCY_PATHWAYS.flatMap((pathway) => [pathway.action.en, pathway.textAction?.en ?? ""]);
    expect(labels.join(" ")).not.toMatch(/call or text/i);
  });

  it("shows emergency links and no timing planner", async () => {
    const { container } = render(<Harness />);
    expect(screen.getByRole("link", { name: "Call 911 now" })).toHaveAttribute("href", "tel:911");
    expect(screen.getByRole("link", { name: "Call 9-8-8" })).toHaveAttribute("href", "tel:988");
    expect(screen.getByRole("link", { name: "Text 9-8-8 Suicide Crisis Helpline" })).toHaveAttribute("href", "sms:988");
    expect(screen.getByRole("link", { name: "Text CONNEX to 247247" })).toHaveAttribute("href", "sms:247247?body=CONNEX");
    expect(screen.queryByLabelText(/washroom|toilettes|continuous travel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not in the prototype/i)).not.toBeInTheDocument();
    expect(screen.getByRole("note").textContent).toBe(TIMING_BOUNDARY.en);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(document.documentElement.lang).toBe("fr");
    expect(screen.getByRole("link", { name: "Composer le 911 maintenant" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Texter le 9-8-8 Ligne d'aide en cas de crise de suicide" })).toHaveAttribute("href", "sms:988");
    expect(screen.getByRole("link", { name: "Texter CONNEX au 247247" })).toHaveAttribute("href", "sms:247247?body=CONNEX");
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
