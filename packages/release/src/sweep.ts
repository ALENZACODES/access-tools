/**
 * Day 24 endorsement sweep. Walks every exported value of a package and
 * checks each string for a claim the App must not make: an endorsement, a
 * verified-data claim, a guarantee, live status, a medical instruction, an
 * eligibility decision, or a mention of AI. A hit is an overclaim to fix.
 */
export interface OverclaimRule {
  id: string;
  pattern: RegExp;
}

export const OVERCLAIM_RULES: readonly OverclaimRule[] = [
  { id: "endorsement", pattern: /\b(endorsed by|approved by|in partnership with|official (partner|app)|partnered with)\b/i },
  { id: "endorsement-fr", pattern: /\b(approuvée? par|en partenariat avec|partenaire officiel|application officielle)\b/i },
  { id: "verified-claim", pattern: /(?<!un)(?<!not )\bverified (place|places|data|record|records|accessible|entrance|washroom)\b/i },
  { id: "verified-claim-fr", pattern: /(?<!non )\b(lieu|lieux|données|fiche|fiches|enregistrement)s? vérifiée?s?\b/i },
  {
    id: "guarantee",
    pattern: /(?<!not )(?<!no )\b(guaranteed|always accessible|fully accessible|100% accessible)\b|\b(est garantie?|sont garantie?s|accès garanti|entièrement accessible)\b/i,
  },
  { id: "live-claim", pattern: /(?<!no )(?<!not )\b(real-time|live (status|availability) (is|are) (on|shown|current))\b|(?<!pas )(?<!aucun )\ben temps réel\b/i },
  {
    id: "medical-instruction",
    pattern: /\b(you should (take|stop|change)|consult your doctor before|dosage|medication schedule|pressure relief every|improves? (memory|cognition)|clinically (proven|shown)|vous devriez prendre|posologie|améliore la mémoire)\b/i,
  },
  { id: "eligibility", pattern: /\b(you are eligible|vous êtes admissible|vous avez droit)\b|(?<!whether )(?<!if )(?<!mean )\byou qualify\b/i },
  { id: "ai-mention", pattern: /\b(AI|A\.I\.|IA|artificial intelligence|intelligence artificielle|machine learning|chatbot|LLM|GPT|Claude)\b/ },
];

export interface OverclaimHit {
  where: string;
  rule: string;
  text: string;
}

/** Collects every string reachable from a value, with a dotted path. Functions are skipped. */
export function collectStrings(value: unknown, path: string, out: Array<[string, string]> = [], seen = new Set<unknown>()): Array<[string, string]> {
  if (typeof value === "string") {
    out.push([path, value]);
    return out;
  }
  if (value === null || typeof value !== "object" || seen.has(value)) return out;
  seen.add(value);
  // React elements and components are code, not copy.
  if ("$$typeof" in (value as Record<string, unknown>)) return out;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, out, seen));
    return out;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    collectStrings(child, `${path}.${key}`, out, seen);
  }
  return out;
}

export function sweep(strings: ReadonlyArray<readonly [string, string]>, rules: readonly OverclaimRule[] = OVERCLAIM_RULES): OverclaimHit[] {
  const hits: OverclaimHit[] = [];
  for (const [where, text] of strings) {
    for (const rule of rules) {
      if (rule.pattern.test(text)) hits.push({ where, rule: rule.id, text: text.slice(0, 160) });
    }
  }
  return hits;
}
