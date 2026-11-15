#!/usr/bin/env node
/**
 * Fail CI if U+FFFD (Unicode replacement character) appears in package
 * source, README files, Markdown, or JSON copy. Those characters mean
 * copy was corrupted in a patch or checkout and must be restored to
 * real UTF-8.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const MARK = "\uFFFD";
const root = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
]);
const SKIP_FILES = new Set(["package-lock.json"]);
const COPY_EXT = new Set([".md", ".json"]);

function shouldScan(name, rel) {
  if (SKIP_FILES.has(name)) return false;
  if (name.startsWith("README")) return true;
  if (COPY_EXT.has(extname(name).toLowerCase())) return true;
  const posix = rel.split("\\").join("/");
  if (/(^|\/)src\//.test(posix) || posix.startsWith("src/")) return true;
  return false;
}

function walk(dir, files) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(root, path);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path, files);
    } else if (shouldScan(entry.name, rel)) {
      files.push(path);
    }
  }
}

const files = [];
walk(root, files);

const hits = [];
for (const file of files) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!text.includes(MARK)) continue;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (line.includes(MARK)) hits.push(`${relative(root, file)}:${index + 1}`);
  }
}

if (hits.length > 0) {
  console.error(`U+FFFD replacement character found in ${hits.length} location(s):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`No U+FFFD in ${files.length} scanned source, README, Markdown and JSON file(s).`);
