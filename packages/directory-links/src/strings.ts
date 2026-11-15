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
    intro: "R�pertoire et liens seulement. Ces liens ouvrent des pages g�r�es par d�autres organisations.",
    notAffiliated: "La pr�sence d�une page ici ne signifie pas que son �diteur appuie l�App ou en est partenaire.",
    linksHeading: "Pages de prestations, du 211 et d�aide au transport",
    unverified: "Lien non v�rifi�",
    publisher: "�diteur", licence: "Licence", lastChecked: "Derni�re v�rification",
    notRecorded: "non consign�e", unknown: "Inconnu",
    profileHeading: "Profil d�aide aux passagers",
    profileIntro: "Saisissez seulement ce que vous choisissez de partager. Il reste sur cet appareil. Exportez-le et apportez le fichier ou la feuille au formulaire d�aide affich� par le service que vous utilisez.",
    displayName: "Nom � utiliser", mobilityNotes: "Notes de mobilit� que vous choisissez de partager",
    attendant: "Voyage avec un accompagnateur", attendantYes: "Oui", attendantNo: "Non", attendantUnset: "Non pr�cis�",
    transferNotes: "Notes sur les transferts",
    exportJson: "Exporter en JSON", exportText: "Exporter en feuille texte", print: "Imprimer la feuille", preview: "Aper�u de la feuille",
    sheetTitle: "Profil d�aide aux passagers",
    sheetNote: "R�dig� par la personne nomm�e ci-dessous. Non v�rifi� ni confirm� par une organisation.",
    exportedOn: "Export� le",
    wavHeading: "V�hicules adapt�s aux fauteuils roulants et lignes d�aide",
    wavLabel: "Disponibilit� des v�hicules adapt�s aux fauteuils roulants",
    wavNone: "L�App n�a aucune information sur la disponibilit� des v�hicules. Consultez les pages officielles ci-dessous.",
    source: "Source", tier: "Niveau", date: "R�cup�r� le",
  },
};
