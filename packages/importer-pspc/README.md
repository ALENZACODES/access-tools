# @access-tools/importer-pspc

## English

Streaming importer and validator for the PSPC open dataset "Total Accessibility Score of PSPC owned and lease-purchased buildings" (CSA B651-18). It keeps Ontario rows only and emits one record per building with the publisher's building-level score, the standard it was scored against, and the assessment fiscal year.

- The score is the publisher's. It is never converted into step-free, entrance, washroom, parking or any other fact; those facts are present and UNKNOWN.
- A score is kept only when it is an integer 0–100 and a standard is named. Otherwise the fact is UNKNOWN and the reason is counted (`score-missing`, `score-out-of-range`, `standard-missing`). Text such as "unknown" or a decimal counts as `score-out-of-range`.
- No coordinates in the CSV, so `geometry` is null. Nothing is geocoded.
- Records are tier 0, `SEEDED-OPEN-DATA`, `open-data-import`.
- In the report, `read` counts Ontario rows (plus rows too malformed to classify). Rows from other provinces are `skipped-out-of-province`, not rejected. Counts describe one run and are not a coverage claim.
- Source: Public Services and Procurement Canada, Open Government Licence – Canada 2.0. "Contains information licensed under the Open Government Licence – Canada." An attribution line is not an endorsement or a partnership, and the App is not endorsed by the publisher.
- The App does not give medical or benefits-eligibility advice. This importer feeds a directory only.

Run (Node 22+):

```
npm run import -w @access-tools/importer-pspc -- --out out
npm run import -w @access-tools/importer-pspc -- --file path/to/local.csv --date 2026-11-15
```

Output goes to the git-ignored `out/`: gzip NDJSON parts (at most 20 MB each, `--max-bytes` to change), `manifest.json` (file, records, bytes, sha256) and `report.json`. Do not commit `out/`. Tests use the committed fixtures and never touch the network.

## Français

Importateur et validateur en flux du jeu de données ouvert de SPAC « Score d'accessibilité total des immeubles de SPAC » (CSA B651-18). Il ne garde que les lignes de l'Ontario et produit un enregistrement par bâtiment : le score du diffuseur pour l'ensemble du bâtiment, la norme appliquée et l'exercice financier de l'évaluation.

- Le score est celui du diffuseur. Il n'est jamais converti en accès sans marche, entrée, toilettes, stationnement ni autre fait; ces faits sont présents et INCONNUS.
- Un score n'est conservé que s'il est un entier de 0 à 100 et qu'une norme est indiquée. Sinon, le fait est INCONNU et la raison est comptée.
- Le CSV n'a pas de coordonnées : `geometry` est nul. Aucun géocodage.
- Les enregistrements sont de niveau 0, `SEEDED-OPEN-DATA`, `open-data-import`.
- Les lignes des autres provinces sont comptées comme `skipped-out-of-province`, et non comme rejetées. Les nombres décrivent une seule exécution et ne constituent pas une déclaration de couverture.
- Source : Services publics et Approvisionnement Canada, Licence du gouvernement ouvert – Canada 2.0. Une mention de source n'est ni un appui ni un partenariat.
- L'application ne donne aucun avis médical ni sur l'admissibilité à des prestations. Cet importateur alimente un répertoire seulement.
