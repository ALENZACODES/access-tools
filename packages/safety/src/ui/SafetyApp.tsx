import { useState } from "react";
import type { Language } from "../types.js";
import { SafetyPanel, type SafetyPanelProps } from "./SafetyPanel.js";

/** Stateful wrapper that owns the language choice. */
export function SafetyApp(props: Omit<SafetyPanelProps, "language" | "onLanguage">): JSX.Element {
  const [language, setLanguage] = useState<Language>("en");
  return <SafetyPanel {...props} language={language} onLanguage={setLanguage} />;
}
