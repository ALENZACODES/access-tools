# Toronto open-data importer / Importateur de données ouvertes de Toronto

## English

This package streams CKAN datastore records from the City of Toronto into validated, tier-0 records for the App. Run from the repository root with `npm run import -w @access-tools/importer-toronto -- toronto-traffic-signals-aps` (or `all`). By default, `retrievedAt` is the UTC date (`YYYY-MM-DD`). Output is kept in this package's ignored `out/` directory. Inspect `report.json` and `manifest.json` before distributing any partitions. Counts are not a coverage claim. Missing accessibility information remains UNKNOWN. The traffic-signal APS flag means present only when `AUDIBLEPEDSIGNAL` is exactly numeric 1. Neither the POPS designation nor parks amenities text establishes wheelchair access.

The parks dataset is held until its licence has been checked. Pass a JSON licence record with `checkedOn` (YYYY-MM-DD), `urlRead` (the dataset URL) and `result` (`open`, `open-recorded` or `not-open`) as the second argument. A held source generates only a report, not data partitions. Review licence evidence and outputs before publication. The source counts are snapshots, not guarantees of completeness or current operation.

Contains information licensed under the Open Government Licence – Toronto.

Attribution is not an endorsement of the App by the City of Toronto.

## Français

Ce module importe progressivement les données CKAN de la Ville de Toronto et produit des enregistrements de niveau 0 pour the App. Exécutez `npm run import -w @access-tools/importer-toronto -- all` à la racine du dépôt. Par défaut, `retrievedAt` est la date UTC (`YYYY-MM-DD`). Les sorties se trouvent dans `out/`, qui est exclu de Git. Consultez `report.json` et `manifest.json` avant toute diffusion. Les chiffres ne constituent pas une garantie de couverture. Les renseignements d’accessibilité absents demeurent INCONNUS. Un espace ouvert au public n'est pas nécessairement accessible en fauteuil roulant.

Les données sur les installations de loisirs sont retenues jusqu'à la vérification de leur licence. Fournissez un fichier JSON contenant `checkedOn`, `urlRead` et `result` en deuxième argument. Sans autorisation, seul le rapport est produit.

Contient des renseignements fournis sous la Licence du gouvernement ouvert – Toronto.

Cette attribution ne signifie pas que la Ville de Toronto appuie the App.
