import { createRoot } from "react-dom/client";
import { HandoffAudit } from "./ui.js";
import { demonstrationHandoff, demonstrationRecords } from "./fixtures.js";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(<HandoffAudit initialRecords={demonstrationRecords} handoff={demonstrationHandoff} asOf="2026-11-15" />);
