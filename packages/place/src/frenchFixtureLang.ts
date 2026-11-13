const FIXTURE_PROSE = /fixture|synthetic|not a real|not a data|labelled fixture|skeleton seed/i;
const SKIP_KEYS = new Set(["honestyNoteFr", "nameFr"]);
const TEXT_ATTRIBUTES = ["label", "aria-label", "alt", "title"] as const;

/** English fixture prose from a pack. French fields and short tokens are left out. */
export function englishFixtureSamples(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (node: unknown, key?: string) => {
    if (typeof key === "string" && SKIP_KEYS.has(key)) return;
    if (typeof node === "string") {
      const text = node.trim();
      if (text.length >= 8 && /\s/.test(text) && /[A-Za-z]/.test(text) && FIXTURE_PROSE.test(text)) found.add(text);
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node && typeof node === "object") {
      for (const [childKey, child] of Object.entries(node as Record<string, unknown>)) walk(child, childKey);
    }
  };
  walk(value);
  return [...found];
}

function languageOf(node: Node): string | null {
  const start = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  let current: Element | null = start;
  while (current) {
    const lang = current.getAttribute("lang");
    if (lang) return lang.toLowerCase();
    current = current.parentElement;
  }
  return null;
}

function isEnglish(lang: string | null): boolean {
  return lang === "en" || (lang !== null && lang.startsWith("en-"));
}

export interface FixtureLanguageRow {
  sample: string;
  occurrences: number;
  unmarked: string[];
}

/**
 * For each sample, count rendered text nodes and name-bearing attributes.
 * An occurrence is unmarked when the nearest lang is not English.
 */
export function auditFixtureLanguage(root: HTMLElement, samples: readonly string[]): FixtureLanguageRow[] {
  const doc = root.ownerDocument;
  const textNodes: Text[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) textNodes.push(node as Text);
  }
  const elements = [...root.querySelectorAll("*")];
  return samples.map((sample) => {
    const unmarked: string[] = [];
    let occurrences = 0;
    for (const node of textNodes) {
      const parent = node.parentElement;
      if (!parent || parent.closest("style, script")) continue;
      if (!node.textContent?.includes(sample)) continue;
      occurrences += 1;
      const lang = languageOf(parent);
      if (!isEnglish(lang)) unmarked.push(`text “${sample}” under lang=${lang ?? "none"}`);
    }
    for (const element of elements) {
      for (const attr of TEXT_ATTRIBUTES) {
        const value = element.getAttribute(attr);
        if (!value?.includes(sample)) continue;
        occurrences += 1;
        const lang = languageOf(element);
        if (!isEnglish(lang)) unmarked.push(`${attr} “${sample}” under lang=${lang ?? "none"}`);
      }
    }
    return { sample, occurrences, unmarked };
  });
}
