// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseCsv, type CsvRow } from "#src/csv";
import { fixture, linesOf } from "./helpers";

async function rows(text: string): Promise<CsvRow[]> {
  const out: CsvRow[] = [];
  for await (const r of parseCsv(linesOf(text))) out.push(r);
  return out;
}

describe("parseCsv", () => {
  it("reads quoted French addresses with embedded commas", async () => {
    const r = await rows(fixture("pspc-ontario-sample.csv"));
    expect(r).toHaveLength(4);
    expect(r[0]!.values["Structure-address_Adresse-du-structure_fra"]).toBe("249, rue Wellington");
    expect(r[0]!.values["Structure-name_Nom-du-structure_fra"]).toBe("Édifice de la Justice");
    expect(r[0]!.malformed).toBe(false);
  });

  it("handles doubled quotes and line breaks inside quotes", async () => {
    const r = await rows('a,b\n"say ""hi"", ok","two\nlines"\n');
    expect(r).toHaveLength(1);
    expect(r[0]!.values).toEqual({ a: 'say "hi", ok', b: "two\nlines" });
  });

  it("strips a UTF-8 BOM from the header", async () => {
    const r = await rows("﻿a,b\n1,2\n");
    expect(Object.keys(r[0]!.values)).toEqual(["a", "b"]);
  });

  it("accepts CRLF and LF line ends", async () => {
    const crlf = await rows("a,b\r\n1,2\r\n3,4\r\n");
    const lf = await rows("a,b\n1,2\n3,4\n");
    expect(crlf.map((x) => x.values)).toEqual(lf.map((x) => x.values));
    expect(crlf).toHaveLength(2);
  });

  it("flags rows with the wrong field count or an unclosed quote", async () => {
    const r = await rows('a,b\n1\n"open,2\n');
    expect(r.map((x) => x.malformed)).toEqual([true, true]);
  });

  it("streams: yields the first row before the input ends", async () => {
    let pulled = 0;
    async function* src() {
      for (const l of ["a", "1", "2", "3"]) {
        pulled++;
        yield l;
      }
    }
    const it = parseCsv(src());
    await it.next();
    expect(pulled).toBe(2);
  });
});
