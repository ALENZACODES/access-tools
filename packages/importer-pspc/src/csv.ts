export interface CsvRow {
  values: Record<string, string>;
  /** 1-based line where the row starts. */
  line: number;
  /** True when the field count differs from the header or a quote never closed. */
  malformed: boolean;
}

function scan(text: string): { fields: string[]; open: boolean } {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  let atStart = true;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += c;
    } else if (c === '"' && atStart) {
      inQuotes = true;
      atStart = false;
    } else if (c === ",") {
      fields.push(cur);
      cur = "";
      atStart = true;
    } else {
      cur += c;
      atStart = false;
    }
  }
  fields.push(cur);
  return { fields, open: inQuotes };
}

/**
 * Streaming CSV reader. Takes lines, yields one row at a time.
 * Handles a header row, quoted fields (embedded commas, doubled quotes, line breaks),
 * a UTF-8 BOM, and CRLF or LF line ends.
 */
export async function* parseCsv(lines: AsyncIterable<string>): AsyncGenerator<CsvRow> {
  let header: string[] | null = null;
  let buf: string | null = null;
  let lineNo = 0;
  let startLine = 0;
  let first = true;
  const emit = (fields: string[], line: number, forceBad: boolean): CsvRow | null => {
    if (!header) {
      header = fields.map((h) => h.trim());
      return null;
    }
    const values: Record<string, string> = {};
    header.forEach((h, i) => (values[h] = fields[i] ?? ""));
    return { values, line, malformed: forceBad || fields.length !== header.length };
  };
  for await (let line of lines) {
    lineNo++;
    if (first) {
      first = false;
      if (line.charCodeAt(0) === 0xfeff) line = line.slice(1);
    }
    if (line.endsWith("\r")) line = line.slice(0, -1);
    if (buf === null) {
      if (line === "") continue;
      buf = line;
      startLine = lineNo;
    } else buf += "\n" + line;
    const { fields, open } = scan(buf);
    if (open) continue;
    buf = null;
    const row = emit(fields, startLine, false);
    if (row) yield row;
  }
  if (buf !== null) {
    const row = emit(scan(buf).fields, startLine, true);
    if (row) yield row;
  }
}
