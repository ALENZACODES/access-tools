import { createRoot } from "react-dom/client";
import { App } from "./App.js";
const mount = document.getElementById("root");
if (!mount) throw new Error("Missing application root");
createRoot(mount).render(<App />);
