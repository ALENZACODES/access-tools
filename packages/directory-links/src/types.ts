export type Lang = "en" | "fr";

export type LinkStatus = "listed" | "needs-verification";
export type LinkGroup = "benefits" | "directory" | "transit" | "wav" | "help";

/** Official link-out record. url is null until a person confirms the address. */
export interface OfficialLink {
  id: string;
  group: LinkGroup;
  titleEn: string;
  titleFr: string;
  url: string | null;
  status: LinkStatus;
  publisher: string;
  retrieved_at: string | null;
  licence: "link-out";
  notesEn: string;
  notesFr: string;
}

export type Attendant = "yes" | "no" | "unset";

/** Everything here is typed by the person and stays on the device until exported. */
export interface AssistanceProfile {
  displayName: string;
  mobilityNotes: string;
  attendant: Attendant;
  transferNotes: string;
}

/** A sourced statement about wheelchair-accessible vehicles, passed in by the host. */
export interface WavFact {
  text: string;
  source_id: string;
  licence: string;
  retrieved_at: string;
  tier: 0 | 1 | 2 | 3;
}
