import ts from "typescript";

export interface HardcodedUiCopy {
  file: string;
  line: number;
  text: string;
}

const TEXT_ATTRS = new Set([
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "aria-roledescription",
  "title",
  "alt",
  "placeholder",
  "label",
]);

/** Units, punctuation, and status tokens are not UI sentences. */
export function isIgnorableUiText(text: string): boolean {
  const trimmed = text.replace(/\{slot\}/g, "").trim();
  if (!/[A-Za-z]/.test(trimmed)) return true;
  if (trimmed === "en" || trimmed === "fr") return true;
  if (/^[A-Za-z][A-Za-z0-9]*(?:[.-][A-Za-z0-9]+)*\.?$/.test(trimmed) && trimmed.includes(".")) return true;
  if (/^[A-Z][A-Z0-9_-]+$/.test(trimmed)) return true;
  if (/^[\d\s.,:;–—\-+/()]*m?\.?$/.test(trimmed)) return true;
  if (/^(https?:|tel:|sms:|#|\/)/.test(trimmed)) return true;
  return false;
}

function isInside(root: ts.Node, node: ts.Node): boolean {
  let current: ts.Node | undefined = node;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

/** Which language a bilingual conditional shows this string in. */
function languageArm(node: ts.Node): "en-ui" | "fr-ui" | "none" {
  let current: ts.Node = node;
  while (current.parent) {
    const parent = current.parent;
    if (ts.isConditionalExpression(parent) && !isInside(parent.condition, node)) {
      const cond = parent.condition.getText();
      const inTrue = isInside(parent.whenTrue, node);
      if (/===?\s*["']fr["']/.test(cond) || /!==?\s*["']en["']/.test(cond)) return inTrue ? "fr-ui" : "en-ui";
      if (/===?\s*["']en["']/.test(cond) || /!==?\s*["']fr["']/.test(cond)) return inTrue ? "en-ui" : "fr-ui";
    }
    current = parent;
  }
  return "none";
}

function attributeName(node: ts.Node): string | null {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isJsxAttribute(current)) {
      return ts.isIdentifier(current.name) ? current.name.text : null;
    }
    if (ts.isJsxElement(current) || ts.isJsxFragment(current) || ts.isSourceFile(current)) return null;
    current = current.parent;
  }
  return null;
}

function isUserFacing(node: ts.Node): boolean {
  if (ts.isJsxText(node)) return true;
  const attr = attributeName(node);
  if (attr) return TEXT_ATTRS.has(attr);
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isPropertyAssignment(current) && ts.isIdentifier(current.name) && (current.name.text === "en" || current.name.text === "fr")) {
      return true;
    }
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      ["setError", "copy", "searchCopy", "finderCopy", "labelOf", "searchFill", "finderFill", "fill"].includes(current.expression.text)
    ) {
      return true;
    }
    if (ts.isJsxElement(current) || ts.isJsxFragment(current)) {
      const parent = node.parent;
      return Boolean(parent && (ts.isJsxExpression(parent) || ts.isJsxText(node)));
    }
    current = current.parent;
  }
  return false;
}

function consider(hits: HardcodedUiCopy[], file: string, source: ts.SourceFile, node: ts.Node, text: string): void {
  if (isIgnorableUiText(text)) return;
  if (node.parent && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent))) return;
  const arm = languageArm(node);
  if (arm === "none" && !isUserFacing(node)) return;
  const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  hits.push({ file, line, text: text.replace(/\s+/g, " ").trim() });
}

/** English and French UI copy typed into a component, instead of the i18n catalogue. */
export function findHardcodedUiCopy(file: string, sourceText: string): HardcodedUiCopy[] {
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: HardcodedUiCopy[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) consider(hits, file, source, node, node.getText(source));
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) consider(hits, file, source, node, node.text);
    else if (ts.isTemplateExpression(node)) {
      const parts = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
      consider(hits, file, source, node, parts.join("{slot}"));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}
