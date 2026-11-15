import { useState } from "react";
import { catalog as defaultCatalog, isLive } from "./catalog";
import { emptyProfile, exportProfileJson, exportProfileText } from "./profile";
import { strings } from "./strings";
import type { AssistanceProfile, Attendant, Lang, OfficialLink, WavFact } from "./types";
import "./DirectoryLinks.css";

function typography(lang: Lang) {
  const colon = lang === "fr" ? "\u00A0: " : ": ";
  const dash = " \u2014 ";
  return { colon, dash };
}

export function LinkList({ links, lang }: { links: OfficialLink[]; lang: Lang }) {
  const s = strings[lang];
  const { colon, dash } = typography(lang);
  return (
    <ul className="directory-links">
      {links.map((l) => (
        <li key={l.id}>
          <p>
            {isLive(l) ? (
              <a href={l.url as string} rel="noopener noreferrer">{lang === "fr" ? l.titleFr : l.titleEn}</a>
            ) : (
              <span>{lang === "fr" ? l.titleFr : l.titleEn} <em>({s.unverified})</em></span>
            )}
          </p>
          <p>{lang === "fr" ? l.notesFr : l.notesEn}</p>
          <p>
            {s.publisher}{colon}{l.publisher}{dash}{s.licence}{colon}{l.licence}{dash}{s.lastChecked}{colon}{l.retrieved_at ?? s.notRecorded}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function WavSection({ lang, links, wavFact }: { lang: Lang; links: OfficialLink[]; wavFact?: WavFact }) {
  const s = strings[lang];
  const { colon, dash } = typography(lang);
  // Tier 0 is an unverified draft and is never shown as a fact.
  const shown = wavFact && wavFact.tier > 0 ? wavFact : undefined;
  return (
    <section aria-labelledby="dl-wav">
      <h2 id="dl-wav">{s.wavHeading}</h2>
      <p>
        {s.wavLabel}{colon}{shown ? shown.text : s.unknown}
      </p>
      {shown ? (
        <p>
          {s.source}{colon}{shown.source_id}{dash}{s.licence}{colon}{shown.licence}{dash}{s.date}{colon}{shown.retrieved_at}{dash}{s.tier}{colon}{shown.tier}
        </p>
      ) : (
        <p>{s.wavNone}</p>
      )}
      <LinkList links={links.filter((l) => l.group === "wav" || l.group === "help")} lang={lang} />
    </section>
  );
}

function save(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProfileSection({ lang }: { lang: Lang }) {
  const s = strings[lang];
  const [p, setP] = useState<AssistanceProfile>(emptyProfile);
  const today = () => new Date().toISOString().slice(0, 10);
  const set = <K extends keyof AssistanceProfile>(k: K, v: AssistanceProfile[K]) => setP({ ...p, [k]: v });
  const radios: [Attendant, string][] = [["yes", s.attendantYes], ["no", s.attendantNo], ["unset", s.attendantUnset]];
  return (
    <section className="directory-links" aria-labelledby="dl-profile">
      <h2 id="dl-profile">{s.profileHeading}</h2>
      <p>{s.profileIntro}</p>
      <p>
        <label htmlFor="dl-name">{s.displayName}</label><br />
        <input id="dl-name" type="text" autoComplete="off" value={p.displayName} onChange={(e) => set("displayName", e.target.value)} />
      </p>
      <fieldset>
        <legend>{s.attendant}</legend>
        {radios.map(([v, label]) => (
          <label key={v}>
            <input type="radio" name="dl-attendant" value={v} checked={p.attendant === v} onChange={() => set("attendant", v)} /> {label}
          </label>
        ))}
      </fieldset>
      <p>
        <label htmlFor="dl-mobility">{s.mobilityNotes}</label><br />
        <textarea id="dl-mobility" rows={3} value={p.mobilityNotes} onChange={(e) => set("mobilityNotes", e.target.value)} />
      </p>
      <p>
        <label htmlFor="dl-transfer">{s.transferNotes}</label><br />
        <textarea id="dl-transfer" rows={3} value={p.transferNotes} onChange={(e) => set("transferNotes", e.target.value)} />
      </p>
      <p>
        <button type="button" onClick={() => save("assistance-profile.json", exportProfileJson(p, today()), "application/json")}>{s.exportJson}</button>{" "}
        <button type="button" onClick={() => save("assistance-profile.txt", exportProfileText(p, lang, today()), "text/plain")}>{s.exportText}</button>{" "}
        <button type="button" onClick={() => window.print()}>{s.print}</button>
      </p>
      <h3>{s.preview}</h3>
      <pre>{exportProfileText(p, lang, today())}</pre>
    </section>
  );
}

export function DirectoryLinks({ lang, links = defaultCatalog, wavFact }: { lang: Lang; links?: OfficialLink[]; wavFact?: WavFact }) {
  const s = strings[lang];
  return (
    <main className="directory-links" lang={lang}>
      <h1>{s.title}</h1>
      <p>{s.intro}</p>
      <p>{s.notAffiliated}</p>
      <section aria-labelledby="dl-links">
        <h2 id="dl-links">{s.linksHeading}</h2>
        <LinkList links={links.filter((l) => l.group === "benefits" || l.group === "directory" || l.group === "transit")} lang={lang} />
      </section>
      <ProfileSection lang={lang} />
      <WavSection lang={lang} links={links} wavFact={wavFact} />
    </main>
  );
}
