import type { Lang } from "./types";

export interface Strings {
  title: string; intro: string; notAffiliated: string;
  linksHeading: string; unverified: string; publisher: string; licence: string;
  lastChecked: string; notRecorded: string; unknown: string;
  profileHeading: string; profileIntro: string;
  displayName: string; mobilityNotes: string; attendant: string; attendantYes: string;
  attendantNo: string; attendantUnset: string; transferNotes: string;
  exportJson: string; exportText: string; print: string; preview: string;
  sheetTitle: string; sheetNote: string; exportedOn: string;
  wavHeading: string; wavLabel: string; wavNone: string;
  source: string; tier: string; date: string;
}

export const strings: Record<Lang, Strings> = {
  en: {
    title: "Official links",
    intro: "Directory and linking only. These links open pages run by other organisations.",
    notAffiliated: "Listing a page here does not mean its publisher endorses or partners with the App.",
    linksHeading: "Benefits, 211 and transit assistance pages",
    unverified: "Link not yet verified",
    publisher: "Publisher", licence: "Licence", lastChecked: "Last checked",
    notRecorded: "not recorded", unknown: "Unknown",
    profileHeading: "Passenger assistance profile",
    profileIntro: "Type only what you choose to share. It stays on this device. Export it and bring the file or sheet to the assistance form posted by the service you use.",
    displayName: "Name to use", mobilityNotes: "Mobility notes you choose to share",
    attendant: "Travelling with an attendant", attendantYes: "Yes", attendantNo: "No", attendantUnset: "Not stated",
    transferNotes: "Transfer notes",
    exportJson: "Export as JSON", exportText: "Export as text sheet", print: "Print sheet", preview: "Sheet preview",
    sheetTitle: "Passenger assistance profile",
    sheetNote: "Written by the person named below. Not checked or confirmed by any organisation.",
    exportedOn: "Exported on",
    wavHeading: "Wheelchair-accessible vehicles and help lines",
    wavLabel: "Wheelchair-accessible vehicle availability",
    wavNone: "This App has no information on vehicle availability. Use the official pages below.",
    source: "Source", tier: "Tier", date: "Retrieved",
  },
  fr: {
    title: "Liens officiels",
    intro: "Répertoire et liens seulement. Ces liens ouvrent des pages gérées par d’autres organisations.",
    notAffiliated: "La présence d’une page ici ne signifie pas que son éditeur appuie l’App ou en est partenaire.",
    linksHeading: "Pages de prestations, du 211 et d’aide au transport",
    unverified: "Lien non vérifié",
    publisher: "Éditeur", licence: "Licence", lastChecked: "Dernière vérification",
    notRecorded: "non consignée", unknown: "Inconnu",
    profileHeading: "Profil d’aide aux passagers",
    profileIntro: "Saisissez seulement ce que vous choisissez de partager. Il reste sur cet appareil. Exportez-le et apportez le fichier ou la feuille au formulaire d’aide affiché par le service que vous utilisez.",
    displayName: "Nom à utiliser", mobilityNotes: "Notes de mobilité que vous choisissez de partager",
    attendant: "Voyage avec un accompagnateur", attendantYes: "Oui", attendantNo: "Non", attendantUnset: "Non précisé",
    transferNotes: "Notes sur les transferts",
    exportJson: "Exporter en JSON", exportText: "Exporter en feuille texte", print: "Imprimer la feuille", preview: "Aperçu de la feuille",
    sheetTitle: "Profil d’aide aux passagers",
    sheetNote: "Rédigé par la personne nommée ci-dessous. Non vérifié ni confirmé par une organisation.",
    exportedOn: "Exporté le",
    wavHeading: "Véhicules adaptés aux fauteuils roulants et lignes d’aide",
    wavLabel: "Disponibilité des véhicules adaptés aux fauteuils roulants",
    wavNone: "L’App n’a aucune information sur la disponibilité des véhicules. Consultez les pages officielles ci-dessous.",
    source: "Source", tier: "Niveau", date: "Récupéré le",
  },
};
