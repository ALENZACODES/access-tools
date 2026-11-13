import { useId } from "react";
import { copy } from "../i18n.js";
import type { FieldRowView } from "../project.js";
import type { Lang } from "../types.js";
import { EnglishText } from "./EnglishText.js";

const COLUMNS = {
  en: ["Field", "Value", "Tier", "Source", "Source date", "Record date"],
  fr: ["Champ", "Valeur", "Niveau", "Source", "Date de source", "Date de fiche"],
} as const;

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
  const labelId = useId();
  if (rows.length === 0) return null;
  const columns = COLUMNS[lang];
  return (
    // The overflow region is a keyboard scroll container, so it keeps tabIndex 0.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard scroll container
    <div className="table-scroll" tabIndex={0} role="region" aria-labelledby={labelId}>
      <table>
        <caption id={labelId} className="visually-hidden">
          {captionEnglish ? <span lang="en">{caption}</span> : caption} {copy("region.fields", lang)}
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
