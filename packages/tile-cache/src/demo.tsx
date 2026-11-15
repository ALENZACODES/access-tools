import { createRoot } from "react-dom/client";
import { TileCache } from "./index";
import { StatusPanel } from "./StatusPanel";
import type { Locale } from "./catalog";

const params = new URLSearchParams(window.location.search);
const locale: Locale = params.get("lang") === "fr" ? "fr" : "en";
document.documentElement.lang = locale;
const root = document.getElementById("root");
if (!root) throw new Error("Demo root missing");
createRoot(root).render(<StatusPanel locale={locale} status={new TileCache(2).status()} />);
