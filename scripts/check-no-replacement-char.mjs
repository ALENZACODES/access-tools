#!/usr/bin/env node
/**
 * Fail CI if U+FFFD (Unicode replacement character) appears under src/
 * or any package src directory. Those characters mean copy was corrupted in a patch or
 * checkout and must be restored to real UTF-8.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MARK = "\uFFFD";
const roots = [];
if (existsSync("src") && statSync("src").isDirectory()) roots.push("src");
if (existsSync("packages") && statSync("packages").isDirectory()) {
  for (const name of readdirSync("packages")) {
    const dir = join("packages", name, "src");
    if (existsSync(dir) && statSync(dir).isDirectory()) roots.push(dir);
  }
}

function walk(dir, files) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
}

const hits = [];
for (const root of roots) {
  const files = [];
  walk(root, files);
  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!text.includes(MARK)) continue;
    for (const [index, line] of text.split(/\r?\n/).entries()) {
      if (line.includes(MARK)) hits.push(`${file}:${index + 1}`);
    }
  }
}

if (hits.length > 0) {
  console.error(`U+FFFD replacement character found in ${hits.length} location(s):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`No U+FFFD under ${roots.join(", ")}.`);
