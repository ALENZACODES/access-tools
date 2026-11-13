/** Fold accents so café and cafe match. Tokens shorter than 2 characters are dropped, except numbers. */
export function tokenize(value: string): string[] {
  const folded = value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return folded.split(/[^a-z0-9]+/u).filter((token) => token.length >= 2 || /^\d+$/.test(token));
}

export function tokenSet(value: string): Set<string> {
  return new Set(tokenize(value));
}
