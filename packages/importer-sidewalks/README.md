# Sidewalk and pedestrian segment importer / Importateur des segments piétonniers

## English

The App imports eight municipal layers from six Ontario cities. Records are tier 0 (`SEEDED-OPEN-DATA`), **not surveyed accessibility assessments**. UNKNOWN stays unknown: missing widths, slopes, ramps, surfaces, etc. are never inferred. Kitchener's `CURBCUT` describes the city's segment attribute, **not a survey of every ramp**. Counts are not a coverage claim.

Run `npm run import --workspace @access-tools/importer-sidewalks -- <source-id|all> [output-dir] [licence-record.json]` on Node 22. The default output is `out/`; gzip NDJSON parts, per-source manifests and a root index are release assets, **not committed data**. Sources marked `verify` are held without network access or output until a dated licence record is supplied (`{"checkedOn":"YYYY-MM-DD","urlRead":"https://...","result":"approved"}`). Verify the actual terms before approval. Toronto topo needs a verified CKAN resource ID in the source registry before it can be downloaded. Never interpret source attribution as endorsement. By default, `retrievedAt` is the UTC calendar date (`YYYY-MM-DD` from `Date#toISOString`). Waterloo `CLEARED_BY` is a coded winter-maintenance category (`City Crews`, `Private Owner`, `Unknown`, `No winter maintenance`, `Shared - City Crews and Private Owner`), not a person's name; other values are dropped.

Attribution: City of Brampton, Sidewalks, CC BY 4.0

Attribution: Contains information licensed under the Open Government Licence – Toronto.

## Français

L’App importe huit couches municipales de six villes ontariennes. Les données sont de niveau 0 (`SEEDED-OPEN-DATA`) et ne constituent **pas des évaluations d’accessibilité sur place**. Les renseignements absents restent INCONNUS : aucune largeur, pente ou rampe n’est supposée. L’attribut `CURBCUT` de Kitchener se rapporte au segment municipal et non à une inspection de chaque rampe. Les totaux ne constituent pas une mesure de couverture.

Utilisez `npm run import --workspace @access-tools/importer-sidewalks -- <identifiant|all> [dossier] [licence.json]` avec Node 22. Les fichiers compressés, manifestes et index sont destinés aux ressources de publication et non au dépôt. Une source dont la licence reste à vérifier est retenue jusqu’à l’ajout d’une attestation datée. Le jeu topographique de Toronto exige un identifiant CKAN confirmé. Les mentions de source ne constituent pas un appui à l’App. Par défaut, `retrievedAt` est la date calendaire UTC (`YYYY-MM-DD` provenant de `Date#toISOString`). Le champ `CLEARED_BY` de Waterloo est une catégorie opérationnelle de déneigement, pas un nom de personne.

Attribution : City of Brampton, Sidewalks, CC BY 4.0

Attribution : Contains information licensed under the Open Government Licence – Toronto.
