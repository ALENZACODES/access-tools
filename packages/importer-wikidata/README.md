# @access-tools/importer-wikidata

## English

Importer and validator for Wikidata items located in Ontario that carry property P2846 (wheelchair accessibility). Input is a SPARQL JSON result (`application/sparql-results+json`). The catalogue counted 276 such items on 2026-11-15. Licence: CC0 1.0. Every non-null fact still records source, licence, date and tier.

**What the fact means.** `facts.wheelchairAccessibilityStatement` is a Wikidata statement, not a measurement. Nobody from the App visited the place. The statement is never mapped onto step-free access, entrance, washroom or parking facts, which stay UNKNOWN.

Mapping:

| P2846 value | Fact value |
| --- | --- |
| Q24192067 | `accessible` |
| Q24192069 | `partially-accessible` |
| Q24192068 | `inaccessible` |
| anything else | UNKNOWN, reason `unmapped-value` |

An item with several P2846 values becomes one record. If the values disagree the fact is UNKNOWN, reason `conflicting-statements`. A missing or malformed `Point(lon lat)` gives `geometry: null` and reason `no-coordinates` in the report; the record is still written. English and French labels are kept separately and a missing label stays null. Nothing is geocoded.

Records are tier 0, label `SEEDED-OPEN-DATA`, verifier `open-data-import`.

Run (needs Node 22; the query goes to https://query.wikidata.org/sparql):

```
npm run import -w @access-tools/importer-wikidata -- [--input result.json] [--out out] [--date YYYY-MM-DD] [--max-bytes N]
```

If `--date` is omitted, `retrievedAt` defaults to the UTC date (`YYYY-MM-DD`).

Output goes to the git-ignored `out/` folder: gzip NDJSON parts of at most 20 MB, `manifest.json` (file, records, bytes, sha256 per part) and `report.json`. Do not commit them; upload as release assets. The report gives rows read, records written, rejections, UNKNOWN counts and an EN/FR summary. Its counts are not a coverage claim.

Attribution: data from Wikidata, released under CC0 1.0. Attribution is optional. An attribution line is not an endorsement or a partnership.

Tests use only the committed fixtures and never touch the network.

## Français

Importateur et validateur des éléments Wikidata situés en Ontario qui portent la propriété P2846 (accessibilité en fauteuil roulant). L’entrée est un résultat SPARQL JSON (`application/sparql-results+json`). Le catalogue a dénombré 276 éléments le 2026-11-15. Licence : CC0 1.0. Chaque fait non nul consigne tout de même la source, la licence, la date et le niveau.

**Ce que signifie le fait.** `facts.wheelchairAccessibilityStatement` est une déclaration de Wikidata, et non une mesure. Personne de l’application n’a visité le lieu. La déclaration n’est jamais associée à l’accès sans marche, à l’entrée, aux toilettes ou au stationnement, qui restent INCONNUS (UNKNOWN).

Correspondance :

| Valeur P2846 | Valeur du fait |
| --- | --- |
| Q24192067 | `accessible` |
| Q24192069 | `partially-accessible` |
| Q24192068 | `inaccessible` |
| toute autre valeur | UNKNOWN, motif `unmapped-value` |

Un élément ayant plusieurs valeurs P2846 devient une seule fiche. Si les valeurs divergent, le fait est UNKNOWN, motif `conflicting-statements`. Une coordonnée `Point(lon lat)` absente ou mal formée donne `geometry: null` et le motif `no-coordinates` dans le rapport ; la fiche est tout de même écrite. Les libellés anglais et français sont conservés séparément et un libellé absent reste nul. Aucun géocodage n’est fait.

Les fiches sont de niveau 0, avec l’étiquette `SEEDED-OPEN-DATA` et le vérificateur `open-data-import`.

Exécution (Node 22 requis ; la requête est envoyée à https://query.wikidata.org/sparql) :

```
npm run import -w @access-tools/importer-wikidata -- [--input result.json] [--out out] [--date YYYY-MM-DD] [--max-bytes N]
```

Si `--date` est omis, `retrievedAt` correspond par défaut à la date UTC (`YYYY-MM-DD`).

Les sorties vont dans le dossier `out/`, ignoré par git : parties NDJSON compressées (gzip) d’au plus 20 Mo, `manifest.json` (fichier, fiches, octets, sha256 par partie) et `report.json`. Ne pas les versionner ; les téléverser comme fichiers de publication. Le rapport donne les lignes lues, les fiches écrites, les rejets, les comptes UNKNOWN et un résumé EN/FR. Ses totaux ne constituent pas une affirmation de couverture.

Attribution : données de Wikidata, publiées sous CC0 1.0. L’attribution est facultative. Une mention d’attribution n’est ni un appui ni un partenariat.

Les tests n’utilisent que les jeux d’essai versionnés et n’accèdent jamais au réseau.
