import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DIRECTORY, DirectoryView, emptyNote, toggleProgram, type Language as DirectoryLanguage, type NavigatorNote } from "../../packages/navigator/src/index.js";
import { TimingPanel, blankTimingDocument, parseTimingDocument, type TimingDocument } from "../../packages/timing/src/index.js";
import { GamesApp, defaultSettings, type GamesRound, type GamesSettings } from "../../packages/games/src/index.js";

type Tab = "directory" | "timing" | "games";

const exampleLegs = [
  { id: "example-a", label: "Example leg, not a real route", durationMin: 40 },
  { id: "example-b", label: "Example leg, not a real route", durationMin: 70 },
];

function Harness() {
  const [tab, setTab] = useState<Tab>("directory");
  const [language, setLanguage] = useState<DirectoryLanguage>("en");
  const [note, setNote] = useState<NavigatorNote>(emptyNote());
  const [timing, setTiming] = useState<TimingDocument>(blankTimingDocument());
  const [settings, setSettings] = useState<GamesSettings>(defaultSettings("harness-player-1"));
  const [rounds, setRounds] = useState<GamesRound[]>([]);
  const tabStyle = { boxSizing: "border-box" as const, minHeight: "48px", marginRight: "0.5rem", font: "inherit" };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div>
      <p>Test harness for directory, timing, and games. It is not the product shell.</p>
      <nav aria-label="Sections" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        <button type="button" style={tabStyle} aria-current={tab === "directory" ? "page" : undefined} onClick={() => setTab("directory")}>
          Directory
        </button>
        <button type="button" style={tabStyle} aria-current={tab === "timing" ? "page" : undefined} onClick={() => setTab("timing")}>
          Timing
        </button>
        <button type="button" style={tabStyle} aria-current={tab === "games" ? "page" : undefined} onClick={() => setTab("games")}>
          Games
        </button>
      </nav>
      {tab === "directory" ? (
        <DirectoryView
          records={DIRECTORY}
          language={language}
          note={note}
          onLanguage={setLanguage}
          onToggle={(id) => setNote((current) => toggleProgram(current, id))}
          onClearNote={() => setNote(emptyNote())}
        />
      ) : null}
      {tab === "timing" ? (
        <TimingPanel
          language={language}
          document={timing}
          legs={exampleLegs}
          waypoints={[]}
          onLanguage={setLanguage}
          onChange={(document) => setTiming(parseTimingDocument(document))}
        />
      ) : null}
      {tab === "games" ? (
        <GamesApp
          settings={{ ...settings, language }}
          rounds={rounds}
          seed={4}
          onSettings={(next) => {
            setLanguage(next.language);
            setSettings(next);
          }}
          onRound={(round) => setRounds((current) => [...current, round])}
          onResetStreak={() => setRounds([])}
        />
      ) : null}
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<Harness />);
