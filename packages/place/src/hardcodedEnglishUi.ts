import ts from "typescript";

export interface HardcodedUiCopy {
  file: string;
  line: number;
  text: string;
}

const CATALOG_FNS = new Set([
  "setError",
  "copy",
  "phrase",
  "searchCopy",
  "finderCopy",
  "labelOf",
  "searchFill",
  "finderFill",
  "fill",
  "gameCopy",
  "gamePhrase",
  "directoryCopy",
  "timingCopy",
]);

/** Attributes whose string values are not interface copy. */
const NON_TEXT_ATTRS = new Set([
  "className",
  "id",
  "htmlFor",
  "style",
  "role",
  "type",
  "href",
  "src",
  "rel",
  "target",
  "scope",
  "method",
  "encType",
  "autoComplete",
  "inputMode",
  "pattern",
  "min",
  "max",
  "step",
  "tabIndex",
  "key",
  "style",
  "width",
  "height",
  "colSpan",
  "rowSpan",
  "headers",
  "dateTime",
  "datetime",
  "accept",
  "form",
  "name",
  "slot",
  "lang",
  "xmlns",
  "viewBox",
  "checked",
  "disabled",
  "readOnly",
  "required",
  "selected",
  "hidden",
  "open",
  "multiple",
  "aria-hidden",
  "aria-current",
  "aria-expanded",
  "aria-controls",
  "aria-labelledby",
  "aria-describedby",
  "aria-live",
  "aria-atomic",
  "aria-invalid",
  "aria-pressed",
  "aria-selected",
  "aria-checked",
  "aria-modal",
  "aria-haspopup",
  "aria-busy",
  "aria-required",
  "aria-sort",
  "aria-orientation",
  "aria-valuemin",
  "aria-valuemax",
  "aria-valuenow",
  "aria-errormessage",
]);

const TEXT_ARIA = new Set([
  "aria-label",
  "aria-description",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
]);

const TEXT_PROPS = new Set([
  "heading",
  "label",
  "title",
  "alt",
  "placeholder",
  "caption",
  "description",
  "message",
  "text",
  "summary",
  "error",
  "hint",
  "legend",
]);

/** Units, language codes, URLs, and catalogue keys are not interface sentences. */
export function isIgnorableUiText(text: string, inCatalogCall = false, model = false): boolean {
  const withoutSlots = text.replace(/\{slot\}/g, "").trim();
  if (!/[A-Za-z]/.test(withoutSlots)) return true;
  if (withoutSlots === "en" || withoutSlots === "fr") return true;
  if (/^(https?:|tel:|sms:|#|\/)/.test(text.trim())) return true;
  if (/^(m|mm|cm|km)\.?$/i.test(withoutSlots)) return true;
  if (inCatalogCall && /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)*\.?$/.test(withoutSlots) && withoutSlots.includes(".")) {
    return true;
  }
  if (/^[a-z0-9]+(?:[.-][a-z0-9]+)+$/.test(withoutSlots)) return true;
  if (!model) return false;
  if (/^(in|kg|h)\.?$/i.test(withoutSlots)) return true;
  if (isMeasurement(withoutSlots)) return true;
  if (/^[a-z][a-z0-9_-]*$/.test(withoutSlots)) return true;
  if (/^[a-z0-9._:-]+$/.test(withoutSlots)) return true;
  if (/^[a-z][A-Za-z0-9]*$/.test(withoutSlots)) return true;
  if (/^T\d{2}:\d{2}/.test(withoutSlots)) return true;
  if (/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/.test(withoutSlots)) return true;
  if (!/\s/.test(withoutSlots) && (/\[/.test(withoutSlots) || /\.[A-Za-z0-9_{]/.test(withoutSlots))) return true;
  if (text.includes("font-family") || text.includes(":where(")) return true;
  return false;
}

/** A measurement such as "900 mm (35.4 in)" is not a sentence. */
function isMeasurement(text: string): boolean {
  const words = text
    .replace(/[0-9.,()%:+-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.length > 0 && words.every((word) => /^(mm|cm|km|m|in|kg|h)$/i.test(word));
}

function isInside(root: ts.Node, node: ts.Node): boolean {
  let current: ts.Node | undefined = node;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function inCatalogCall(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isCallExpression(current) && ts.isIdentifier(current.expression) && CATALOG_FNS.has(current.expression.text)) {
      return current.arguments.some((argument) => argument === node || isInside(argument, node));
    }
    if (ts.isSourceFile(current)) return false;
    current = current.parent;
  }
  return false;
}

function inThrow(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (ts.isThrowStatement(current)) return true;
    if (ts.isSourceFile(current) || ts.isFunctionLike(current)) return false;
    current = current.parent;
  }
  return false;
}

function inTypePosition(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;
  while (current) {
    if (
      ts.isLiteralTypeNode(current) ||
      ts.isTypeReferenceNode(current) ||
      ts.isExpressionWithTypeArguments(current) ||
      ts.isTypeAliasDeclaration(current) ||
      ts.isInterfaceDeclaration(current) ||
      ts.isTypeLiteralNode(current)
    ) {
      return true;
    }
    if (ts.isSourceFile(current)) return false;
    current = current.parent;
  }
  return false;
}

function isComparisonOperand(node: ts.Node): boolean {
  const parent = node.parent;
  if (!parent || !ts.isBinaryExpression(parent)) return false;
  const kind = parent.operatorToken.kind;
  return (
    kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
    kind === ts.SyntaxKind.EqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsToken
  );
}

function attributeOf(node: ts.Node): ts.JsxAttribute | null {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isJsxAttribute(current)) return current;
    if (ts.isJsxElement(current) || ts.isJsxFragment(current) || ts.isJsxSelfClosingElement(current)) return null;
    current = current.parent;
  }
  return null;
}

function attributeName(attribute: ts.JsxAttribute): string {
  return ts.isIdentifier(attribute.name) ? attribute.name.text : attribute.name.getText();
}

function isHandlerName(name: string): boolean {
  return name.startsWith("on") && name.length > 2 && name[2] === name[2]?.toUpperCase();
}

function isNonTextAttribute(name: string): boolean {
  if (isHandlerName(name) || name.startsWith("data-")) return true;
  if (name.startsWith("aria-") && !TEXT_ARIA.has(name)) return true;
  return NON_TEXT_ATTRS.has(name);
}

function hostTag(attribute: ts.JsxAttribute): string | null {
  const opening = attribute.parent?.parent;
  if (!opening || (!ts.isJsxOpeningElement(opening) && !ts.isJsxSelfClosingElement(opening))) return null;
  return ts.isIdentifier(opening.tagName) ? opening.tagName.text : null;
}

function inputType(attribute: ts.JsxAttribute): string | null {
  const attributes = attribute.parent;
  if (!attributes || !ts.isJsxAttributes(attributes)) return null;
  for (const item of attributes.properties) {
    if (!ts.isJsxAttribute(item) || attributeName(item) !== "type" || !item.initializer) continue;
    if (ts.isStringLiteral(item.initializer)) return item.initializer.text;
  }
  return null;
}

function looksLikeProse(text: string): boolean {
  const trimmed = text.trim();
  if (/\s/.test(trimmed) || /[.!?;:]/.test(trimmed)) return true;
  return /^[A-Z][A-Z0-9]{1,}$/.test(trimmed);
}

function isEnumToken(text: string): boolean {
  return /^[a-z0-9_-]+$/.test(text.trim());
}

function isDirectAttributeValue(node: ts.Node, attribute: ts.JsxAttribute): boolean {
  const initializer = attribute.initializer;
  if (!initializer) return false;
  if (initializer === node) return true;
  return ts.isJsxExpression(initializer) && initializer.expression === node;
}

function propertyName(node: ts.Node): string | null {
  const parent = node.parent;
  if (!parent || !ts.isPropertyAssignment(parent) || parent.initializer !== node) return null;
  if (ts.isIdentifier(parent.name)) return parent.name.text;
  if (ts.isStringLiteral(parent.name)) return parent.name.text;
  return null;
}

function isButtonValue(attribute: ts.JsxAttribute): boolean {
  const tag = hostTag(attribute);
  const type = inputType(attribute);
  return (tag === "input" || tag === "button") && (type === "submit" || type === "button" || type === "reset");
}

function attributeIsCopy(node: ts.Node, text: string): boolean {
  const attribute = attributeOf(node);
  if (!attribute) return false;
  const name = attributeName(attribute);
  if (isNonTextAttribute(name)) return false;
  if (name === "value" || name === "defaultValue") {
    if (isButtonValue(attribute)) return true;
    return looksLikeProse(text) || !isEnumToken(text);
  }
  if (TEXT_ARIA.has(name) || TEXT_PROPS.has(name) || name === "label" || name === "title" || name === "alt" || name === "placeholder") {
    return true;
  }
  if (isDirectAttributeValue(node, attribute)) return !isEnumToken(text);
  const property = propertyName(node);
  if (property && TEXT_PROPS.has(property)) return true;
  return looksLikeProse(text);
}

function isJsxChild(node: ts.Node): boolean {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isJsxAttribute(current)) return false;
    if (ts.isJsxElement(current) || ts.isJsxFragment(current)) return true;
    current = current.parent;
  }
  return false;
}

function isRendered(node: ts.Node, text: string): boolean {
  if (ts.isJsxText(node)) return true;
  if (attributeOf(node)) return attributeIsCopy(node, text);
  return isJsxChild(node);
}

function literalText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join("{slot}");
  return null;
}

function declarationInitializer(statement: ts.Statement, name: string): ts.Expression | null {
  if (!ts.isVariableStatement(statement)) return null;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
      return declaration.initializer;
    }
  }
  return null;
}

function resolveInitializer(identifier: ts.Identifier): ts.Expression | null {
  let current: ts.Node | undefined = identifier.parent;
  while (current) {
    const statements =
      ts.isSourceFile(current) || ts.isBlock(current) || ts.isModuleBlock(current)
        ? current.statements
        : ts.isCaseClause(current) || ts.isDefaultClause(current)
          ? current.statements
          : null;
    if (statements) {
      for (const statement of statements) {
        if (statement.pos >= identifier.pos) break;
        const found = declarationInitializer(statement, identifier.text);
        if (found) return found;
      }
    }
    current = current.parent;
  }
  return null;
}

/** English and French UI copy typed into a component or model file, instead of the i18n catalogue. */
export function findHardcodedUiCopy(file: string, sourceText: string, model = false): HardcodedUiCopy[] {
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const hits: HardcodedUiCopy[] = [];
  const seen = new Set<number>();

  const push = (node: ts.Node, text: string, forced: boolean) => {
    if (isComparisonOperand(node) || inTypePosition(node) || inThrow(node)) return;
    if (node.parent && (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent))) return;
    if (isIgnorableUiText(text, inCatalogCall(node), model)) return;
    if (!forced && !model && !isRendered(node, text)) return;
    const position = node.getStart(source);
    if (seen.has(position)) return;
    seen.add(position);
    const line = source.getLineAndCharacterOfPosition(position).line + 1;
    hits.push({ file, line, text: text.replace(/\s+/g, " ").trim() });
  };

  const flagInitializer = (expression: ts.Expression) => {
    const visitInitializer = (node: ts.Node) => {
      const text = literalText(node);
      if (text !== null) push(node, text, true);
      ts.forEachChild(node, visitInitializer);
    };
    visitInitializer(expression);
  };

  const visit = (node: ts.Node) => {
    const text = literalText(node);
    if (text !== null) push(node, text, false);
    if (ts.isJsxText(node)) push(node, node.getText(source), false);
    const tagName = node.parent && (ts.isJsxOpeningElement(node.parent) || ts.isJsxClosingElement(node.parent) || ts.isJsxSelfClosingElement(node.parent));
    if (ts.isIdentifier(node) && !tagName && isRendered(node, node.text)) {
      const initializer = resolveInitializer(node);
      if (initializer) flagInitializer(initializer);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}
