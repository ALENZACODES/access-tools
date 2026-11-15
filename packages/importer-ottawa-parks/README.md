# Ottawa parks inventory importer / Importateur de l’inventaire des parcs d’Ottawa

## English

This package imports the City of Ottawa Parks_Inventory ArcGIS MapServer's 25 layers with an `ACCESSIBLE` field, **excluding layer 14 (Parking)**. The catalogue counted 11,391 records on 2026-11-15; that is a source snapshot, **not a coverage claim**. Features are paged in batches of 2,000, ordered by object ID. Files are gzip NDJSON partitions capped at 20 MiB with a SHA-256 manifest and validated report.

`ACCESSIBLE` is **the city's own flag for the asset**. Its definition is not published alongside the field. Only `yes/oui`, `y`, `no/non` and `n` are mapped to yes/no. Every other value is UNKNOWN. It does **not** establish step-free routes, entrance accessibility or washroom accessibility. Source dates come from `MODIFIED_DATE`, the layer's last edit, or (with a note) the run date. No geometry is guessed or geocoded. Names are retained in English and French when supplied.

All fixtures in `test/fixtures/` are **demonstration data**, shaped like actual ArcGIS layer metadata/pages, not surveyed places or statements about actual city assets. The city is the source of the data, not an endorser or partner of the App. Attribution is not endorsement.

The catalogue marks the City of Ottawa Open Data Licence v2.0 as **verify** (the hub calls it custom). Review the actual licence before publication. By default, `npm run import -w @access-tools/importer-ottawa-parks` writes **only** to git-ignored `out/held/`. A checked licence record may be provided with `--licence-record licence-review.json` in the shape `{ "checkedOn": "2026-11-15", "urlRead": "https://...", "result": "open-recorded" }`. Only `open` and `open-recorded` permit output under `out/approved/`. The review is supplied by the operator, not inferred by this importer. Output is not committed. No personal or contact columns are copied.

## Français

Ce paquet importe les 25 couches du service ArcGIS Parks_Inventory de la Ville d’Ottawa qui contiennent le champ `ACCESSIBLE`, **sauf la couche 14 (stationnement)**. Le catalogue dénombrait 11 391 lignes le 15 novembre 2026. Ce nombre **ne constitue pas une preuve de couverture**. L’importation se fait par pages de 2 000 éléments, dans l’ordre des identifiants. Les sorties sont des partitions NDJSON gzip d’au plus 20 Mio, avec manifeste SHA-256 et rapport validé.

`ACCESSIBLE` est **l’indicateur de la Ville pour l’équipement concerné**. Sa définition n’est pas publiée avec le champ. Seules les valeurs explicites `yes/oui`, `y`, `no/non` et `n` sont interprétées. Toute autre valeur demeure INCONNUE. Cet indicateur ne prouve rien sur les parcours sans marches, les entrées ni les toilettes. Les dates proviennent de `MODIFIED_DATE`, de la dernière modification de la couche ou, avec une note, du jour d’importation. Aucune géométrie n’est devinée.

Les données de `test/fixtures/` sont des **exemples de démonstration**, et non des observations de lieux réels. La citation de la source ne constitue ni un partenariat ni un appui à l’App.

La licence de données ouvertes de la Ville d’Ottawa, version 2.0, doit être **vérifiée**. Par défaut, la commande d’importation conserve toutes les sorties dans `out/held/`, dossier exclu de Git. Un enregistrement daté de la vérification de licence, transmis avec `--licence-record`, est nécessaire pour produire des fichiers dans `out/approved/`. Les sorties ne sont pas intégrées au dépôt. Aucune donnée de contact personnel n’est copiée.
