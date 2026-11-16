import { fireEvent } from "@testing-library/react";

type PointerEventName = "pointerover" | "pointerout" | "pointermove";
interface PointerInit {
  pointerType?: string;
  relatedTarget?: Element | null;
  /** Reuses the place of the event before this one, as when the screen changes under a pointer that has not moved. */
  still?: boolean;
}

let place = 0;

/**
 * The test DOM has no PointerEvent class, so a mouse event stands in for one.
 * It carries the fields dwell select reads: pointerType, relatedTarget, and
 * the pointer's place. A pointer that reaches another element has moved, so
 * each event gets a new place unless `still` is set.
 */
function pointer(type: PointerEventName, element: Element, init: PointerInit): void {
  if (!init.still) place += 10;
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, relatedTarget: init.relatedTarget ?? null, clientX: place, clientY: 5 });
  Object.defineProperty(event, "pointerType", { value: init.pointerType ?? "mouse" });
  fireEvent(element, event);
}

export function pointerOver(element: Element, init: PointerInit = {}): void {
  pointer("pointerover", element, init);
}

export function pointerOut(element: Element, init: PointerInit = {}): void {
  pointer("pointerout", element, init);
}

export function pointerMove(element: Element, init: PointerInit = {}): void {
  pointer("pointermove", element, init);
}
