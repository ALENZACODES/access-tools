import type { DirectoryLike, Handoff } from "./types.js";

const licenceNote = { en: "Synthetic demonstration data; no official material reproduced.", fr: "Données de démonstration fictives ; aucun contenu officiel reproduit." };
export const demonstrationRecords: DirectoryLike[] = [
  {
    id: "demo-benefit-a", category: "benefits", name: { en: "Demonstration benefit A", fr: "Prestation fictive A" },
    sourceName: "Synthetic demonstration fixture", licenceNote, verificationTier: "PROTOTYPE-UNVERIFIED", checkedOn: "2026-11-01",
    figure: { statement: { en: "Unknown", fr: "Inconnu" }, qualifier: { en: "No rate supplied", fr: "Aucun taux fourni" }, sourceUrls: [], retrievedOn: "2026-11-01" },
  },
  {
    id: "demo-benefit-b", category: "benefits", name: { en: "Demonstration benefit B", fr: "Prestation fictive B" },
    sourceName: "Synthetic demonstration fixture", licenceNote, verificationTier: "PROTOTYPE-UNVERIFIED", checkedOn: "2026-06-01",
    figure: { statement: { en: "Demonstration $123 (not a real rate)", fr: "Démonstration 123 $ (taux fictif)" }, qualifier: { en: "Synthetic test figure", fr: "Chiffre d’essai fictif" }, sourceUrls: [], retrievedOn: "2026-06-01" },
  },
  {
    id: "demo-benefit-c", category: "benefits", name: { en: "Demonstration benefit C", fr: "Prestation fictive C" },
    sourceName: "Synthetic demonstration fixture", licenceNote, verificationTier: "PROTOTYPE-UNVERIFIED",
    figure: { statement: { en: "Demonstration $456 (not a real rate)", fr: "Démonstration 456 $ (taux fictif)" }, qualifier: { en: "Synthetic test figure", fr: "Chiffre d’essai fictif" }, sourceUrls: [] },
  },
  {
    id: "demo-service-d", category: "services", name: { en: "Demonstration service D", fr: "Service fictif D" },
    sourceName: "Synthetic demonstration fixture", licenceNote, verificationTier: "PROTOTYPE-UNVERIFIED", checkedOn: "2026-09-01",
  },
];

export const demonstrationHandoff: Handoff = {
  schemaVersion: "handoff-1.0.0", id: "demo-handoff-a", fromRecordId: "demo-benefit-a",
  title: { en: "Find a public information page", fr: "Trouver une page d’information publique" },
  checkedOn: "2026-11-01", sourceName: "Synthetic demonstration fixture", licenceNote,
  verificationTier: "PROTOTYPE-UNVERIFIED",
  steps: [
    { kind: "link", label: { en: "Browse a public information portal", fr: "Consulter un portail d’information public" }, url: "https://www.ontario.ca/" },
    { kind: "call", label: { en: "Call the demonstration phone number", fr: "Appeler le numéro de démonstration" }, number: "+1 555 010 2000" },
  ],
};
