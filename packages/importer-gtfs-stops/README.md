# GTFS stop importer / Importateur d'arrêts GTFS

## English

Imports GTFS `stops.txt` from 13 additional Ontario transit feeds into the App's tier-0 prototype records. The feed's explicit `wheelchair_boarding` value is **not** a survey of step-free routes or a guarantee of access. A value of 0, a missing value, or a missing parent means UNKNOWN. Stop children may inherit only a known parent station value and are marked derived. The counts in the import report do **not** claim coverage.

Use Node 22 and the repository's existing dependencies. From the repository root:

```sh
npm run import -w @access-tools/importer-gtfs-stops -- gtfs-kingston-transit /path/to/downloaded.zip
```

By default, `retrievedAt` is the UTC date (`YYYY-MM-DD`). An explicit ZIP file path or ZIP URL is required: registry catalogue URLs are discovery/terms pages, not guaranteed binary downloads. No network access is needed with a local ZIP. Optional third argument: a reviewed licence JSON file, for example `{ "checkedOn": "2026-11-15", "urlRead": "https://example.org/licence", "result": "permission-granted" }`. `restricted` never unlocks a source. Review permissions before using or redistributing data.

Sources marked `verify` or `unknown` are **held** in git-ignored `out/held/<id>/` unless a licence review record allows them. Sources marked `open-recorded` go to `out/open/<id>/`. The output is compressed NDJSON partitions, a SHA-256 manifest, and a JSON report. Files are not committed. Attribution identifies data providers; it does not imply endorsement or partnership with the App. `sourceDate` uses `feed_info.txt` when supplied; otherwise the import date is used with an explanatory report note.

## Français

Cet outil importe les fichiers GTFS `stops.txt` de 13 réseaux ontariens supplémentaires vers les données prototypes de niveau 0 de l’App. Le champ `wheelchair_boarding` décrit uniquement la déclaration de l'organisme : il ne constitue ni une inspection ni une garantie d'accessibilité. Une valeur 0, une absence de valeur ou un parent inconnu signifie UNKNOWN. L'héritage depuis une station parente est explicitement signalé. Les totaux du rapport ne représentent **pas** une mesure de couverture.

Par défaut, `retrievedAt` est la date UTC (`YYYY-MM-DD`). Sous Node 22, exécutez la commande ci-dessus avec un fichier ZIP local ou une URL ZIP explicite. Les pages du catalogue ne sont pas nécessairement des liens de téléchargement. Pour les licences `verify` ou `unknown`, les résultats restent dans `out/held/` tant qu'un examen de licence autorisant leur utilisation n'a pas été fourni. Les deux sources `open-recorded` vont dans `out/open/`. Les données restent hors du dépôt. La mention de la source n'implique ni approbation ni partenariat avec l’App. Consultez le rapport bilingue et vérifiez les conditions de redistribution.
