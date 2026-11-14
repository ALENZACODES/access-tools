import { useState, type RefObject } from "react";
import { switchCss } from "./a11yCss.js";

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

function openDialog(root: ParentNode): HTMLElement | null {
  const dialogs = [...root.querySelectorAll<HTMLDialogElement>("dialog")].filter((dialog) => dialog.open);
  return dialogs.at(-1) ?? null;
}

/** Interactive controls in DOM order. An open dialog is the whole scan; otherwise closed dialogs are skipped. */
export function switchTargets(root: ParentNode): HTMLElement[] {
  const modal = openDialog(root);
  const scope = modal ?? root;
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => {
    if (el.closest("[data-switch-bar]")) return false;
    const dialog = el.closest("dialog");
    if (!modal && dialog) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    return true;
  });
}

function controlName(el: HTMLElement): string {
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  const aria = el.getAttribute("aria-label");
  if (aria) return aria.trim();
  if ("labels" in el && el.labels instanceof NodeList && el.labels.length > 0) {
    return [...el.labels]
      .map((label) => label.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function activate(el: HTMLElement): void {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    el.focus();
    return;
  }
  if (el instanceof HTMLInputElement && el.type !== "checkbox" && el.type !== "radio") {
    el.focus();
    return;
  }
  if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement || el instanceof HTMLInputElement) {
    el.click();
    return;
  }
  el.focus();
}

export function SwitchBar({
  rootRef,
  nextLabel,
  chooseLabel,
  help,
}: {
  rootRef: RefObject<HTMLElement | null>;
  nextLabel: string;
  chooseLabel: string;
  help: string;
}) {
  const [status, setStatus] = useState("");

  function highlighted(root: HTMLElement): HTMLElement | null {
    const items = switchTargets(root);
    const current = root.querySelector<HTMLElement>("[data-switch-current]");
    if (current && items.includes(current)) return current;
    return null;
  }

  function mark(root: HTMLElement, el: HTMLElement): void {
    root.querySelectorAll("[data-switch-current]").forEach((node) => node.removeAttribute("data-switch-current"));
    el.setAttribute("data-switch-current", "true");
    if (typeof el.scrollIntoView === "function") el.scrollIntoView({ block: "nearest" });
    setStatus(controlName(el));
  }

  return (
    <div data-switch-bar>
      <style>{switchCss}</style>
      <p>{help}</p>
      <button
        type="button"
        onClick={() => {
          const root = rootRef.current;
          if (!root) return;
          const items = switchTargets(root);
          if (items.length === 0) return;
          const current = highlighted(root);
          const at = current ? items.indexOf(current) : -1;
          const next = items[(at + 1) % items.length];
          if (next) mark(root, next);
        }}
      >
        {nextLabel}
      </button>{" "}
      <button
        type="button"
        onClick={() => {
          const root = rootRef.current;
          if (!root) return;
          const current = highlighted(root);
          if (current) activate(current);
        }}
      >
        {chooseLabel}
      </button>
      {status ? <p role="status">{status}</p> : null}
    </div>
  );
}
