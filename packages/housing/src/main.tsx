import React from "react";
import { createRoot } from "react-dom/client";
import { HousingFinder } from "./HousingFinder.js";
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<React.StrictMode><HousingFinder /></React.StrictMode>);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => { void navigator.serviceWorker.register("./sw.js"); });
}
