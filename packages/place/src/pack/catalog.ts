import { copy, fill, type CopyKey } from "../i18n.js";
import type { Lang } from "../types.js";
import type { FitNeed, FitStatus } from "./fit.js";

export function packCopy(key: CopyKey, lang: Lang): string {
  return copy(key, lang);
}

export function fitLabel(need: FitNeed, lang: Lang): string {
  const key: Record<FitNeed, CopyKey> = {
    stepFree: "pack.step-free",
    washroom: "pack.washroom-need",
    doorWidth: "pack.door-width",
    changeTable: "pack.change-table",
    parking: "pack.parking",
  };
  return copy(key[need], lang);
}

export function fitStatusLabel(status: FitStatus, lang: Lang): string {
  return copy(status === "known-yes" ? "pack.yes" : status === "known-no" ? "pack.no" : "pack.unknown", lang);
}

export function recordedLine(id: string, lang: Lang): string {
  return fill(copy("pack.recorded", lang), { id });
}

export function photoCreditLine(author: string, lang: Lang): string {
  return fill(copy("pack.photo-credit", lang), { author });
}

export function fitItemLine(need: FitNeed, status: FitStatus, lang: Lang): string {
  return fill(copy("pack.fit-item", lang), { need: fitLabel(need, lang), status: fitStatusLabel(status, lang) });
}

export function sourceIdIsOsm(sourceId: string): boolean {
  return sourceId.startsWith("osm");
}
