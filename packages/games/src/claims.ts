import { BATCH_COPY } from "./batch2/copy.js";
import { BATCH_THREE_COPY } from "./batch3/copy.js";
import { GAME_COPY } from "./i18n.js";

/**
 * Wording the games must not use. A game is recreation. It does not treat,
 * train, measure, or improve a person, and it does not borrow a commercial
 * product's name. A sentence that denies a claim ("does not provide medical
 * advice", "not a prescription") is allowed and is not matched here.
 */
export const BANNED_CLAIMS: ReadonlyArray<{ id: string; pattern: RegExp }> = [
  { id: "lumosity", pattern: /lumosity/i },
  { id: "brain-training", pattern: /brain[\s-]*(train|game|age|fitness)|entra[iî]nement c[ée]r[ée]bral/i },
  { id: "improves", pattern: /\b(improv|boost|sharpen|strengthen|enhanc)\w*\s+(your\s+)?(memory|attention|focus|cognition|brain|mind)/i },
  { id: "ameliore", pattern: /\b(am[ée]lior|renforc|stimul)\w*\s+(votre\s+|la\s+|l')?(m[ée]moire|attention|concentration|cognition|cerveau)/i },
  { id: "therapy", pattern: /th[ée]rap|r[ée]adaptation|rehabilitat|\brehab\b/i },
  { id: "treatment", pattern: /\btreat(s|ment|ments)?\b|\btraitement/i },
  { id: "clinical", pattern: /clinical|clinique|scientifically|scientifiquement|\bproven\b|\bprouv[ée]/i },
  { id: "diagnosis", pattern: /diagnos|d[ée]pist|\bscreening\b/i },
  { id: "cognitive-benefit", pattern: /cogniti(ve|f|ves|fs)\s+(health|decline|benefit|sant[ée]|d[ée]clin|b[ée]n[ée]fice)|\bIQ\b|\bQI\b|dementia|d[ée]mence/i },
  { id: "recovery", pattern: /\brecover(y|s)?\b|r[ée]tablissement|gu[ée]ri/i },
];

export interface ClaimHit {
  key: string;
  language: "en" | "fr";
  rule: string;
}

type CopyCatalogue = Record<string, { en: string; fr: string }>;

/** Every string catalogue the games read. A new batch of games adds its catalogue here. */
export const GAMES_COPY_CATALOGUES: ReadonlyArray<{ id: string; copy: CopyCatalogue }> = [
  { id: "first-ten", copy: GAME_COPY },
  { id: "batch-two", copy: BATCH_COPY },
  { id: "batch-three", copy: BATCH_THREE_COPY },
];

/** All catalogues as one, each key prefixed with its catalogue id so two catalogues can share a key. */
export function allGamesCopy(): CopyCatalogue {
  const merged: CopyCatalogue = {};
  for (const catalogue of GAMES_COPY_CATALOGUES) {
    for (const [key, row] of Object.entries(catalogue.copy)) merged[`${catalogue.id}/${key}`] = row;
  }
  return merged;
}

/**
 * Scans every English and French string a person can see in the games:
 * the first ten games, the second and third batches, and dwell select.
 */
export function healthClaimHits(catalog: CopyCatalogue = allGamesCopy()): ClaimHit[] {
  const hits: ClaimHit[] = [];
  for (const [key, row] of Object.entries(catalog)) {
    for (const language of ["en", "fr"] as const) {
      for (const rule of BANNED_CLAIMS) {
        if (rule.pattern.test(row[language])) hits.push({ key, language, rule: rule.id });
      }
    }
  }
  return hits;
}
