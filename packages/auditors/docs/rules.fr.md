# Règles pour les auditeurs et les responsables de lieux — Français

Ceci est une **démonstration seulement**. Ce n’est ni un avis juridique, ni une entente de service, ni un audit certifié, ni une preuve de propriété. L’application n’anime aucun groupe réel d’auditeurs, n’authentifie aucun responsable et n’assure aucun service de correction. Tout se passe sur l’appareil, et les fiches d’exemple sont des données fictives étiquetées. Ce texte français est une ébauche à faire réviser.

## Relevé d’audit

L’audit d’un lieu est un ensemble d’observations par champ. Chaque observation contient une valeur mesurée en millimètres ou **Inconnu**, le rôle de la personne, un identifiant local, la date d’observation, une référence photo facultative, ainsi que la source, la licence et la date de la fiche. Une référence photo comprend un identifiant local, un nom de fichier, une description et une date. **Aucune image ne quitte l’appareil.** Inconnu ne signifie jamais zéro.

## Niveaux de vérification

Les niveaux sont ceux de `packages/place/src/types.ts` : 0 (non contrôlé de façon indépendante), 1 (signalé), 2 (corroboré), 3 (relevé sur place documenté), 4 (état en direct à échéance) et E (examen d’une page officielle). Ce module ne définit pas de seconde liste. Un audit sur place peut atteindre les niveaux 0 à 3 selon ces règles (`src/observations.ts`) :

- Inconnu, ou l’absence d’observation, correspond au niveau 0.
- Une observation isolée ne dépasse pas le niveau 1, quelle que soit la personne.
- Le niveau 2 exige des mesures de deux personnes différentes qui concordent selon la tolérance configurée (10 mm par défaut). Deux saisies du responsable du lieu ne se corroborent pas entre elles.
- Le niveau 3 exige la mesure d’une personne formée, avec une référence photo, une méthode et une version de protocole, acceptée en révision par une autre personne. Une observation non révisée n’atteint jamais le niveau 3. Une observation rejetée en révision n’est pas utilisée.
- Une observation ultérieure qui ne concorde pas ne remplace pas la valeur. Le champ est indiqué comme contesté et un nouveau contrôle est requis.

Chaque fiche de ce module conserve la mention `PROTOTYPE-UNVERIFIED`, quel que soit le niveau attribué par les règles. La formation cochée sur l’appareil est déclarée par la personne, et aucune révision indépendante n’a lieu sur l’appareil : une saisie faite ici ne peut donc pas atteindre le niveau 3.

## Perte de fraîcheur

Les périodes sont celles de `packages/place/src/staleness.ts` : 180 jours pour le niveau 1, 180 jours pour le niveau 2 (90 jours pour les champs de toilettes) et 365 jours pour le niveau 3. Après 75 % de la période, le champ est indiqué comme vieillissant. Après la période, l’observation n’appuie plus ce niveau : le champ est rétrogradé, la dernière valeur reste visible avec la mention périmé, et un nouveau contrôle est requis. Seule une nouvelle observation rétablit un niveau. Rien n’est promu parce que le temps passe.

## Programme d’audit bénévole

Six étapes de formation déclarées par la personne doivent être cochées avant de prendre une tâche. La file présente d’abord les nouveaux contrôles, puis les champs vieillissants ou périmés, puis les premiers audits, du plus ancien au plus récent. Une tâche se termine seulement avec une observation de la personne qui l’a prise, et Inconnu est un résultat valable. La progression est un décompte des tâches terminées et des champs consignés. Il n’y a ni points, ni rangs, ni classement ; Inconnu compte autant qu’une mesure ; répéter une saisie n’ajoute rien ; les saisies rejetées et les fiches d’exemple ne sont pas comptées. Aucun groupe ni organisme partenaire n’est présumé.

## Réponses du lieu

Un lieu voit les obstacles signalés pour son propre lieu et peut accuser réception, indiquer une correction (avec la date) ou contester (avec un motif). Une réponse ne modifie jamais une observation ni un niveau. « Corrigé » et « Contester » créent une tâche de nouveau contrôle en attente ; la fiche change seulement lorsqu’une observation de contrôle est consignée. La revendication d’un lieu dans cette démonstration ne prouve pas la propriété.

## Processus de correction et niveaux de service

1. Chaque correction ou signalement est **reçu** avec un horodatage et conserve l’historique complet des étapes, des acteurs et des heures.
2. Il est **trié**, puis envoyé en **nouveau contrôle** avec une tâche, puis **réglé** ou **refusé**. Un refus exige un motif. Un règlement exige les observations du nouveau contrôle.
3. **Délais visés proposés**, conservés comme configuration (`DEFAULT_SERVICE_LEVELS`) : 5 jours civils pour le tri, 10 pour lancer le nouveau contrôle, 30 pour la clôture. Ce sont des cibles de conception, pas un engagement de service.
4. Les échéances et les retards sont calculés à partir de l’historique et des délais visés.
5. Le bilan est calculé uniquement à partir des signalements saisis sur l’appareil. Il compte les délais dépassés et les retards, sans les masquer. Sans signalement, il indique « Aucune donnée pour l’instant » et n’affiche aucun chiffre. Les fiches d’exemple ne sont jamais comptées.

## Valeurs proposées automatiquement

Aucune source de propositions automatiques n’est reliée à ce module. Le seuil à respecter se trouve dans `src/gate.ts` : un type de champ peut être publié seulement lorsque des personnes ont révisé au moins 100 propositions échantillonnées pour ce type de champ et en ont jugé moins de 5 % inexactes. Un échantillon insuffisant bloque la publication, et le résultat d’un type de champ ne vaut jamais pour un autre.

Le stockage du navigateur sert à la démonstration et peut être effacé. N’inscrivez aucun renseignement médical personnel.
