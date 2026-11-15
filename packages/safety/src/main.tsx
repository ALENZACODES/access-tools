import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SafetyApp } from "./ui/SafetyApp.js";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <SafetyApp />
    </StrictMode>,
  );
}
