import { fireEvent } from "@testing-library/react";

/**
 * The test DOM has no PointerEvent class, so a mouse event stands in for one.
 * It carries the two fields dwell select reads: pointerType and relatedTarget.
 */
function pointer(type: "pointerover" | "pointerout", element: Element, init: { pointerType?: string; relatedTarget?: Element | null }): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget: init.relatedTarget ?? null });
  Object.defineProperty(event, "pointerType", { value: init.pointerType ?? "mouse" });
  fireEvent(element, event);
}

export function pointerOver(element: Element, init: { pointerType?: string; relatedTarget?: Element | null } = {}): void {
  pointer("pointerover", element, init);
}

export function pointerOut(element: Element, init: { pointerType?: string; relatedTarget?: Element | null } = {}): void {
  pointer("pointerout", element, init);
}
