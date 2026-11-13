import { copy } from "../i18n.js";
import type { Lang } from "../types.js";

const UNKNOWN = new Set(["Unknown", "Inconnu"]);

export function splitEnglish(text: string, fragments: string[]): Array<{ text: string; english: boolean }> {
  const needles = [...new Set(fragments.map((item) => item.trim()).filter((item) => item.length > 0 && text.includes(item)))];
  needles.sort((a, b) => b.length - a.length);
  if (needles.length === 0) return [{ text, english: false }];
  const used = new Array<boolean>(text.length).fill(false);
  const ranges: Array<{ start: number; end: number }> = [];
  for (const needle of needles) {
    let from = 0;
    while (from < text.length) {
      const start = text.indexOf(needle, from);
      if (start === -1) break;
      const end = start + needle.length;
      const overlap = used.slice(start, end).some(Boolean);
      if (!overlap) {
        ranges.push({ start, end });
        for (let index = start; index < end; index += 1) used[index] = true;
      }
      from = end;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const parts: Array<{ text: string; english: boolean }> = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push({ text: text.slice(cursor, range.start), english: false });
    parts.push({ text: text.slice(range.start, range.end), english: true });
    cursor = range.end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), english: false });
  return parts.filter((part) => part.text.length > 0);
}

/** Marks authored English inside a French screen (WCAG 3.1.2). */
export function EnglishText({ lang, text, fragments = [] }: { lang: Lang; text: string; fragments?: string[] }) {
  const parts = lang === "fr" ? splitEnglish(text, fragments) : [{ text, english: false }];
  if (!parts.some((part) => part.english)) return <>{text}</>;
  return (
    <>
      {parts.map((part, index) =>
        part.english ? (
          <span key={index} lang="en">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** A whole record string that is English prose, unless it is the Unknown label. */
export function RecordText({ lang, text }: { lang: Lang; text: string }) {
  if (lang !== "fr" || UNKNOWN.has(text)) return <>{text}</>;
  return <EnglishText lang={lang} text={text} fragments={[text]} />;
}

/** Day 21 note: untranslated fixture text stays English and says so. */
export function EnglishOnlyNote({ lang }: { lang: Lang }) {
  if (lang !== "fr") return null;
  return (
    <p role="note">
      <span lang="en">English only.</span> {copy("note.english-only", "fr")}
    </p>
  );
}
