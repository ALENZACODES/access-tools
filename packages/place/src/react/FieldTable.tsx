import { useId } from "react";
import { copy, type CopyKey } from "../i18n.js";
import type { FieldRowView } from "../project.js";
import type { Lang } from "../types.js";
import { EnglishText } from "./EnglishText.js";

/** French table name. "Identité" becomes "Champs d'identité", not "Identité champs". */
export function frenchFieldCaption(heading: string): string {
  if (heading === copy("section.getting-there", "fr")) return copy("table.caption.getting-there", "fr");
  if (heading === copy("section.inside", "fr")) return copy("table.caption.inside", "fr");
  const lower = heading.slice(0, 1).toLocaleLowerCase("fr-CA") + heading.slice(1);
  const prefix = /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(lower)
    ? copy("table.caption.elided", "fr")
    : copy("table.caption.of", "fr");
  return `${prefix}${lower}`;
}

const COLUMN_KEYS = [
  "table.col.field",
  "table.col.value",
  "table.col.tier",
  "table.col.source",
  "table.col.source-date",
  "table.col.record-date",
] as const satisfies readonly CopyKey[];

export function FieldTable({
  rows,
  caption,
  lang,
  captionEnglish = false,
}: {
  rows: FieldRowView[];
  caption: string;
  lang: Lang;
  /** The caption is an English record name on a French screen. */
  captionEnglish?: boolean;
}) {
  const captionId = useId();
  if (rows.length === 0) return null;
  const columns = COLUMN_KEYS.map((key) => copy(key, lang));
  return (
    // A group names the keyboard scroll stop without adding a landmark.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard scroll container
    <div className="table-scroll" tabIndex={0} role="group" aria-labelledby={captionId}>
      <table>
        <caption id={captionId} className="visually-hidden">
          {lang === "fr" ? (
            captionEnglish ? (
              <>
                {copy("table.caption.prefix", lang)}
                <span lang="en">{caption}</span>
              </>
            ) : (
              frenchFieldCaption(caption)
            )
          ) : (
            `${caption} ${copy("table.fields", lang)}`
          )}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.unknown ? "unknown" : undefined}>
              <th scope="row">{row.label}</th>
              <td>
                <p>
                  <EnglishText lang={lang} text={row.valueText} fragments={row.englishFragments} />
                </p>
                <ul>
                  {row.photos.map((photo) => (
                    <li key={photo.id}>
                      <EnglishText lang={lang} text={photo.text} fragments={photo.englishFragments} />
                    </li>
                  ))}
                </ul>
                <p>{row.freshnessText}</p>
              </td>
              <td>{row.tierText}</td>
              <td>
                {row.sourceName}. {row.licence}
              </td>
              <td>{row.sourceDate}</td>
              <td>{row.recordDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
