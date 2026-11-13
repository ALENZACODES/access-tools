import type { FieldRowView } from "../project.js";
import type { Lang } from "../types.js";
import { EnglishText } from "./EnglishText.js";

/** French table name. "Identité" becomes "Champs d'identité", not "Identité champs". */
export function frenchFieldCaption(heading: string): string {
  if (heading === "S'y rendre") return "Champs pour s'y rendre";
  if (heading === "À l'intérieur") return "Champs de l'intérieur";
  const lower = heading.slice(0, 1).toLocaleLowerCase("fr-CA") + heading.slice(1);
  return /^[aeiouyàâäéèêëîïôöùûüœh]/i.test(lower) ? `Champs d'${lower}` : `Champs de ${lower}`;
}

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
  if (rows.length === 0) return null;
  const columns = COLUMNS[lang];
  return (
    // Keyboard scroll container. The section heading is the landmark, so this is not a region.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard scroll container
    <div className="table-scroll" tabIndex={0}>
      <table>
        <caption className="visually-hidden">
          {lang === "fr" ? (
            captionEnglish ? (
              <>
                {"Champs : "}
                <span lang="en">{caption}</span>
              </>
            ) : (
              frenchFieldCaption(caption)
            )
          ) : (
            `${caption} fields`
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
