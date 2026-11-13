import {
  copy,
  distanceMetres,
  isGeoPoint,
  isOpenAt,
  labelOf,
  REPAIR_DISCLAIMER,
  SUPPLY_STOCK_NOTE,
  tierPhrase,
  unknownLabel,
  type CivilClock,
  type GeoPoint,
  type Lang,
  type PlacePack,
  type RepairService,
  type SupplyCategory,
} from "@access-tools/place";
import { finderCopy, finderFill } from "./i18n.js";

export interface RepairQuery {
  text: string;
  lang: Lang;
  origin: GeoPoint | null;
  kind: "all" | "repair" | "supply";
  mobileOnly: boolean;
  outOfHours: boolean;
  supplyCategory: SupplyCategory | "any";
  openAt: CivilClock | null;
  showHidden: boolean;
}

export interface DirectoryHit {
  id: string;
  kind: "repair" | "supply";
  name: string;
  nameIsEnglish: boolean;
  distanceMetres: number | null;
  servicesText: string;
  hoursText: string;
  phone: string | null;
  website: string | null;
  verificationDate: string;
  tierText: string;
  extraText: string;
  englishFragments: string[];
  hiddenReasons: string[];
}

export interface RepairResult {
  hits: DirectoryHit[];
  hidden: DirectoryHit[];
  disclaimer: string;
  stockNote: string;
  empty: boolean;
}

export function publishedServices(services: RepairService[], lang: Lang): string {
  return services.map((service) => labelOf(`repair.${service}`, lang)).join(", ");
}

export function findRepairAndSupply(pack: PlacePack, query: RepairQuery): RepairResult {
  const needle = query.text.trim().toLowerCase();
  const hits: DirectoryHit[] = [];
  if (query.kind !== "supply") {
    for (const repairer of pack.repairers) {
      const name = query.lang === "fr" && repairer.nameFr ? repairer.nameFr : repairer.name;
      if (needle && !`${name} ${repairer.servicesPublished.join(" ")}`.toLowerCase().includes(needle)) continue;
      const geo = isGeoPoint(repairer.latitude, repairer.longitude);
      const reasons: string[] = [];
      if (query.mobileOnly && !repairer.servicesPublished.includes("mobile")) {
        reasons.push(finderCopy("finder.reason.not-mobile", query.lang));
      }
      if (query.outOfHours && !repairer.servicesPublished.includes("out-of-hours")) {
        reasons.push(finderCopy("finder.reason.not-after-hours", query.lang));
      }
      if (query.openAt && isOpenAt(repairer.hours, query.openAt) !== "open") {
        reasons.push(finderCopy("finder.reason.not-open", query.lang));
      }
      hits.push({
        id: repairer.id,
        kind: "repair",
        name,
        nameIsEnglish: query.lang === "fr" && !repairer.nameFr,
        distanceMetres: query.origin && geo ? distanceMetres(query.origin, geo) : null,
        servicesText:
          repairer.servicesPublished.length === 0
            ? copy("directory.no-services", query.lang)
            : publishedServices(repairer.servicesPublished, query.lang),
        hoursText: repairer.hoursText ?? unknownLabel(query.lang),
        phone: repairer.phone,
        website: repairer.website,
        verificationDate: repairer.provenance.sourceDate,
        tierText: tierPhrase(repairer.provenance, repairer.datasetStatus, query.lang, repairer.publicationContext),
        extraText:
          repairer.mobileRadiusKm === null
            ? finderFill("finder.coverage", query.lang, { note: repairer.coverageNote ?? copy("value.unknown", query.lang) })
            : finderFill("finder.radius", query.lang, { km: repairer.mobileRadiusKm, note: repairer.coverageNote ?? "" }),
        englishFragments: query.lang === "fr" ? [repairer.coverageNote, repairer.hoursText].filter((item): item is string => Boolean(item)) : [],
        hiddenReasons: reasons,
      });
    }
  }
  if (query.kind !== "repair") {
    for (const store of pack.supplyStores) {
      const name = query.lang === "fr" && store.nameFr ? store.nameFr : store.name;
      if (needle && !`${name} ${store.categoriesPublished.join(" ")}`.toLowerCase().includes(needle)) continue;
      const geo = isGeoPoint(store.latitude, store.longitude);
      const reasons: string[] = [];
      if (query.supplyCategory !== "any" && !store.categoriesPublished.includes(query.supplyCategory)) {
        reasons.push(finderCopy("finder.reason.category", query.lang));
      }
      if (query.mobileOnly) reasons.push(finderCopy("finder.reason.not-mobile-repair", query.lang));
      if (query.openAt && isOpenAt(store.hours, query.openAt) !== "open") {
        reasons.push(finderCopy("finder.reason.not-open", query.lang));
      }
      hits.push({
        id: store.id,
        kind: "supply",
        name,
        nameIsEnglish: query.lang === "fr" && !store.nameFr,
        distanceMetres: query.origin && geo ? distanceMetres(query.origin, geo) : null,
        servicesText:
          store.categoriesPublished.length === 0
            ? copy("directory.no-categories", query.lang)
            : store.categoriesPublished.map((category) => labelOf(`supply.${category}`, query.lang)).join(", "),
        hoursText: store.hoursText ?? unknownLabel(query.lang),
        phone: store.phone,
        website: store.website,
        verificationDate: store.provenance.sourceDate,
        tierText: tierPhrase(store.provenance, store.datasetStatus, query.lang, store.publicationContext),
        extraText: finderFill("finder.delivery", query.lang, {
          delivery: store.delivery === null ? copy("value.unknown", query.lang) : store.delivery === "yes" ? copy("value.yes", query.lang) : copy("value.no", query.lang),
          stock: SUPPLY_STOCK_NOTE[query.lang],
        }),
        englishFragments: query.lang === "fr" && store.hoursText ? [store.hoursText] : [],
        hiddenReasons: reasons,
      });
    }
  }
  const hidden = hits.filter((hit) => hit.hiddenReasons.length > 0);
  const shown = hits.filter((hit) => hit.hiddenReasons.length === 0);
  shown.sort((a, b) => a.name.localeCompare(b.name, query.lang));
  hidden.sort((a, b) => a.name.localeCompare(b.name, query.lang));
  return {
    hits: shown,
    hidden,
    disclaimer: REPAIR_DISCLAIMER[query.lang],
    stockNote: SUPPLY_STOCK_NOTE[query.lang],
    empty: shown.length === 0,
  };
}
