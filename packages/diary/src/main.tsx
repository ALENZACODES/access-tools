import { createRoot } from "react-dom/client";
import { Diary } from "./Diary.js";

createRoot(document.getElementById("root")!).render(<Diary />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register("/sw.js");
}
