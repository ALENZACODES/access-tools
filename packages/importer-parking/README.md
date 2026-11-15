# Parking importer / Importateur de stationnement

## English

This package imports published parking information for the App, without claiming that any parking space complies with a standard. It does not infer dimensions, access routes, or accessible-space ratios. Missing facts remain **UNKNOWN**. A published zero count is treated as UNKNOWN because these layers do not establish whether zero means none or not recorded. Waterloo `CAPACITY` means *all spaces*, not accessible spaces. London's `CountDisabledSpaces` was null in all 170 records observed on 2026-11-15; the importer preserves that uncertainty. Toronto AODA labels A and B are copied as `type-a` and `type-b`, without width interpretations.

Toronto is open-licensed. Mississauga, London, Waterloo and Ottawa require review of the actual terms: they are **held** without a dated affirmative licence record. MiWay was already held by access-maps pull request #1 under the same Mississauga terms. Attribution does not mean any publisher endorses or partners with the App.

From the repository root, run `npm run import -w @access-tools/importer-parking -- <source-id> [licence-record.json]` on Node 22. Without a source ID all five are considered. The optional file maps source IDs to objects like `{ "checkedOn": "2026-11-15", "urlRead": "https://example.org/terms", "result": "permitted" }` (replace the example with the actual reviewed licence). The importer writes only approved records under ignored `out/parts/<id>/`; held sources produce a report under `out/held/<id>/` with no records. Every partition is gzip NDJSON, bounded at 20 MiB compressed with a SHA-256 manifest. Reports give source counts, rejects, unknown fields and an explicit non-coverage disclaimer. Do not commit generated outputs. Source dates are catalogue dates, not proof that rows remain current.

## Français

Ce paquet importe les renseignements publiés sur le stationnement pour the App. Il ne confirme aucune conformité à une norme. Il ne déduit ni largeur, ni trajet accessible, ni proportion de places accessibles. Les faits absents restent **UNKNOWN**. Une capacité accessible publiée de zéro reste UNKNOWN, car zéro peut représenter une donnée non saisie. À Waterloo, `CAPACITY` désigne la capacité totale. À London, `CountDisabledSpaces` était nul pour les 170 enregistrements observés le 15 novembre 2026. Les valeurs A et B de Toronto restent des désignations municipales, sans déduction de largeur.

La licence de Toronto est ouverte. Les conditions de Mississauga, London, Waterloo et Ottawa doivent être vérifiées : leurs données sont **retenues** en l’absence d’un relevé de licence positif et daté. MiWay est déjà retenu dans la demande de fusion access-maps nº 1, selon les mêmes conditions de Mississauga. L’attribution d’une source n’implique ni partenariat ni approbation de the App par l’éditeur.

Exécutez `npm run import -w @access-tools/importer-parking -- <source-id> [licence-record.json]` avec Node 22. Le fichier de licences facultatif doit contenir une date de vérification, l’URL des conditions effectivement lues et le résultat `permitted`. Seules les sources autorisées produisent des partitions dans `out/parts/` ; les autres génèrent uniquement un rapport dans `out/held/`. Les rapports indiquent les rejets et les valeurs inconnues ; les décomptes ne prouvent pas l’exhaustivité du territoire.
