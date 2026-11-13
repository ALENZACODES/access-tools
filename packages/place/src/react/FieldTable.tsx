import type { FieldRowView } from "../project.js";
import type { Lang } from "../types.js";

const COLUMNS = {
  en: ["Field", "Value", "Tier", "Source", "Source date", "Record date"],
  fr: ["Champ", "Valeur", "Niveau", "Source", "Date de source", "Date de fiche"],
} as const;

export function FieldTable({ rows, caption, lang }: { rows: FieldRowView[]; caption: string; lang: Lang }) {
  if (rows.length === 0) return null;
  const columns = COLUMNS[lang];
  return (
    <div className="table-scroll" tabIndex={0} role="region" aria-label={`${caption} fields`}>
      <table>
        <caption className="visually-hidden">{caption}</caption>
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
                <p>{row.valueText}</p>
                <ul>
                  {row.photos.map((photo) => (
                    <li key={photo.id}>{photo.text}</li>
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
