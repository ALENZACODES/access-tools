import type { EssentialKey } from './pack-types';
export type Locale = 'en' | 'fr';
export const strings: Record<Locale, {
  heading: string; filters: string; all: string; yes: string; no: string; unknown: string;
  noKnown: string; unknownCount: (n: number) => string; nearby: (n: number) => string;
  distance: (n: number) => string; source: string; fetched: string; tier: string;
  odbl: string; labels: Record<EssentialKey, string>;
}> = {
  en: {
    heading: 'The App — essentials nearby', filters: 'Filter by known information', all: 'Any',
    yes: 'Yes', no: 'No', unknown: 'Unknown',
    noKnown: 'No known match in range. This does not mean none exist.',
    unknownCount: n => `${n} nearby records have Unknown information for at least one selected filter.`,
    nearby: n => `${n} records in range`, distance: n => `${n.toFixed(1)} km away`,
    source: 'Source', fetched: 'Last fetched', tier: 'Tier',
    odbl: '© OpenStreetMap contributors, ODbL',
    labels: { washroom_wheelchair: 'Wheelchair-accessible washroom', parking_accessible: 'Accessible parking',
      adult_change_table: 'Adult change table', hoist: 'Hoist', open_without_purchase: 'Washroom open without purchase',
      staff_refuel: 'Staff will refuel', charging: 'Charging' },
  },
  fr: {
    heading: 'L’App — services essentiels à proximité', filters: 'Filtrer selon les renseignements connus',
    all: 'Tous', yes: 'Oui', no: 'Non', unknown: 'Inconnu',
    noKnown: 'Aucun résultat connu dans le rayon. Cela ne signifie pas qu’il n’en existe aucun.',
    unknownCount: n => `${n} fiches à proximité ont des renseignements inconnus pour au moins un filtre sélectionné.`,
    nearby: n => `${n} fiches dans le rayon`, distance: n => `À ${n.toFixed(1)} km`,
    source: 'Source', fetched: 'Dernière récupération', tier: 'Niveau',
    odbl: '© contributeurs OpenStreetMap, ODbL',
    labels: { washroom_wheelchair: 'Toilettes accessibles en fauteuil roulant', parking_accessible: 'Stationnement accessible',
      adult_change_table: 'Table à langer pour adultes', hoist: 'Lève-personne',
      open_without_purchase: 'Toilettes sans achat obligatoire', staff_refuel: 'Personnel disponible pour faire le plein',
      charging: 'Recharge' },
  },
};
