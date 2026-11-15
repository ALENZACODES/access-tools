/** Parse GTFS CSV incrementally. Embedded newlines in quoted cells are supported. */
export async function* csvRows(lines: AsyncIterable<string>): AsyncGenerator<Record<string, string>> {
  let header: string[] | undefined;
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let pendingQuote = false;
  let first = true;
  async function* process(text: string): AsyncGenerator<string[]> {
    for (const char of text) {
      if (pendingQuote) {
        pendingQuote = false;
        if (char === '"') { cell += '"'; continue; }
        quoted = false;
      }
      if (char === '"' && quoted) { pendingQuote = true; continue; }
      if (char === '"' && !quoted && cell === "") { quoted = true; continue; }
      if (char === "," && !quoted) { cells.push(cell); cell = ""; continue; }
      if (char === "\n" && !quoted) {
        cells.push(cell.replace(/\r$/, ""));
        yield cells;
        cells = [];
        cell = "";
        continue;
      }
      cell += char;
    }
  }
  for await (let line of lines) {
    if (first) { line = line.replace(/^\uFEFF/, ""); first = false; }
    // Accept lines with or without their trailing newline.
    for await (const values of process(line.endsWith("\n") ? line : line + "\n")) {
      if (!header) { header = values; continue; }
      if (values.length === 1 && values[0] === "") continue;
      yield Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""]));
    }
  }
  if (cell || cells.length) {
    cells.push(cell);
    if (!header) return;
    yield Object.fromEntries(header.map((key, index) => [key, cells[index] ?? ""]));
  }
}

export async function* textLines(text: string): AsyncGenerator<string> {
  for (const line of text.split(/\n/)) yield line;
}
