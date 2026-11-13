import { useId, useState, type CSSProperties } from "react";
import { GAMES_BOUNDARY } from "../boundaries.js";
import { choose, createSession, pauseSession, viewSession } from "../engine.js";
import { buildDailySet, daysPlayed, filterGames, searchGames, surpriseGame } from "../hub.js";
import { stepScan } from "../scan.js";
import type { GameSession, GamesRound, GamesSettings, HubFilter, Language } from "../types.js";

const FILTERS: HubFilter[] = ["all", "favourites", "short", "calm", "words", "numbers", "puzzles"];

const FILTER_LABEL: Record<HubFilter, Record<Language, string>> = {
  all: { en: "All games", fr: "Tous les jeux" },
  favourites: { en: "My favourites", fr: "Mes favoris" },
  short: { en: "Short games", fr: "Jeux courts" },
  calm: { en: "Calm games", fr: "Jeux calmes" },
  words: { en: "Word games", fr: "Jeux de mots" },
  numbers: { en: "Number games", fr: "Jeux de nombres" },
  puzzles: { en: "Puzzles", fr: "Casse-tête" },
};

export interface GamesAppProps {
  settings: GamesSettings;
  rounds: GamesRound[];
  onSettings: (settings: GamesSettings) => void;
  onRound: (round: GamesRound) => void;
  now?: Date;
  seed?: number;
}

export function GamesApp(props: GamesAppProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HubFilter>("all");
  const [active, setActive] = useState<GameSession | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const language = props.settings.language;
  const copy = language === "fr" ? fr : en;
  const scale = props.settings.textScale === "extra_large" ? "2.5rem" : props.settings.textScale === "large" ? "2rem" : "1.125rem";
  const colors =
    props.settings.contrast === "high"
      ? { background: "#000", color: "#fff", accent: "#ffe14a", border: "#fff" }
      : { background: "#fff", color: "#1a1a1a", accent: "#102a43", border: "#1a1a1a" };

  function openGame(id: string): void {
    setStartedAt(new Date().toISOString());
    setActive(
      createSession(id, {
        seed: props.seed ?? 1,
        pace: props.settings.pace,
        language,
        timerEnabled: props.settings.timerEnabled,
      }),
    );
  }

  function finishIfNeeded(session: GameSession): void {
    const view = viewSession(session);
    if (view.status === "complete" && startedAt && props.rounds.every((round) => round.startedAt !== startedAt)) {
      props.onRound({
        schemaVersion: "games-round-1.0.0",
        roundId: crypto.randomUUID(),
        playerId: props.settings.playerId,
        gameId: session.metaId,
        pace: session.pace,
        timerEnabled: session.timerEnabled,
        startedAt,
        endedAt: new Date().toISOString(),
        completed: true,
        points: view.points,
        correctCount: view.correctCount,
        trialCount: view.trialCount,
      });
    }
  }

  const frame: CSSProperties = {
    fontFamily: "system-ui, sans-serif",
    fontSize: scale,
    background: colors.background,
    color: colors.color,
    display: "grid",
    gap: "1rem",
    maxWidth: "46rem",
  };
  const button: CSSProperties = {
    minHeight: "48px",
    padding: "0.6rem 0.9rem",
    fontSize: "1em",
    fontWeight: 700,
    background: colors.background,
    color: colors.color,
    border: `3px solid ${colors.border}`,
    borderRadius: "4px",
  };

  if (active) {
    return (
      <GamePlay
        session={active}
        frame={frame}
        button={button}
        colors={colors}
        copy={copy}
        onSession={(session) => {
          setActive(session);
          finishIfNeeded(session);
        }}
        onExit={() => setActive(null)}
      />
    );
  }

  const searched = searchGames(query);
  const filtered = filterGames(filter, props.settings.favouriteGameIds).filter((game) => searched.some((item) => item.id === game.id));
  const daily = buildDailySet({
    minutes: 10,
    skipIds: props.settings.skippedGameIds,
    seed: props.seed ?? 2,
    calmOnly: props.settings.pace === "relaxed",
  });
  const played = daysPlayed(props.rounds, props.now ?? new Date());

  return (
    <main style={frame}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{copy.games}</h1>
        <button
          type="button"
          style={button}
          onClick={() => props.onSettings({ ...props.settings, language: language === "en" ? "fr" : "en" })}
        >
          {language === "en" ? "Français" : "English"}
        </button>
      </header>
      <p role="note" style={note(colors)}>
        {GAMES_BOUNDARY[language]}
      </p>
      <p>{copy.switchHelp}</p>
      {!props.settings.streakOptOut ? <p>{played.message[language]}</p> : null}
      <section aria-labelledby="daily-title">
        <h2 id="daily-title">{copy.daily}</h2>
        <ul>
          {daily.map((game) => (
            <li key={game.id}>
              {game.title[language]} ({game.estimatedMinutes} {copy.minutes})
            </li>
          ))}
        </ul>
      </section>
      <label htmlFor="game-search">
        {copy.search}
        <input id="game-search" value={query} onChange={(event) => setQuery(event.target.value)} style={{ ...button, width: "100%" }} />
      </label>
      <div role="group" aria-label={copy.filters}>
        {FILTERS.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} style={button} onClick={() => setFilter(item)}>
            {FILTER_LABEL[item][language]}
          </button>
        ))}
      </div>
      <button
        type="button"
        style={button}
        onClick={() => openGame(surpriseGame(props.settings.favouriteGameIds, props.seed ?? 3).id)}
      >
        {copy.surprise}
      </button>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
        {filtered.map((game) => (
          <li key={game.id} style={{ border: `3px solid ${colors.border}`, padding: "0.75rem", display: "grid", gap: "0.4rem" }}>
            <h2 style={{ margin: 0 }}>{game.title[language]}</h2>
            <p style={{ margin: 0 }}>{game.summary[language]}</p>
            <p style={{ margin: 0 }}>
              {game.area}. {game.estimatedMinutes} {copy.minutes}. {copy.relaxedAvailable}
            </p>
            <button type="button" style={button} onClick={() => openGame(game.id)}>
              {copy.play} {game.title[language]}
            </button>
          </li>
        ))}
      </ul>
      <fieldset style={{ border: `3px solid ${colors.border}` }}>
        <legend>{copy.settings}</legend>
        <label>
          <input
            type="checkbox"
            checked={props.settings.timerEnabled}
            onChange={(event) => props.onSettings({ ...props.settings, timerEnabled: event.target.checked })}
          />{" "}
          {copy.timer}
        </label>
        <label>
          {copy.pace}{" "}
          <select
            value={props.settings.pace}
            onChange={(event) => props.onSettings({ ...props.settings, pace: event.target.value as GamesSettings["pace"] })}
          >
            <option value="relaxed">{copy.relaxed}</option>
            <option value="standard">{copy.standard}</option>
            <option value="brisk">{copy.brisk}</option>
          </select>
        </label>
        <label>
          {copy.text}{" "}
          <select
            value={props.settings.textScale}
            onChange={(event) =>
              props.onSettings({ ...props.settings, textScale: event.target.value as GamesSettings["textScale"] })
            }
          >
            <option value="default">{copy.textDefault}</option>
            <option value="large">{copy.textLarge}</option>
            <option value="extra_large">{copy.textExtra}</option>
          </select>
        </label>
      </fieldset>
    </main>
  );
}

function GamePlay(props: {
  session: GameSession;
  frame: CSSProperties;
  button: CSSProperties;
  colors: { background: string; color: string; accent: string; border: string };
  copy: typeof en;
  onSession: (session: GameSession) => void;
  onExit: () => void;
}) {
  const view = viewSession(props.session);
  const titleId = useId();
  const [scan, setScan] = useState(0);
  const choices = view.choices;
  const safeScan = choices.length === 0 ? 0 : scan % choices.length;
  const focused = choices[safeScan];

  function pickChoice(id: string): void {
    if (props.session.paused && id !== "resume") return;
    props.onSession(choose(props.session, id));
  }

  return (
    <main style={props.frame}>
      <h1 id={titleId}>{view.title}</h1>
      <p role="note">{GAMES_BOUNDARY[props.session.language]}</p>
      <p aria-live="polite">{view.announcement}</p>
      <p>{view.prompt}</p>
      <p>{view.detail}</p>
      <div role="group" aria-labelledby={titleId} style={{ display: "grid", gap: "0.5rem" }}>
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            style={{
              ...props.button,
              outline: index === safeScan ? `4px solid ${props.colors.accent}` : undefined,
            }}
            onClick={() => pickChoice(choice.id)}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" style={props.button} onClick={() => setScan(stepScan(safeScan, choices.length, 1))}>
          {props.copy.next}
        </button>
        <button
          type="button"
          style={props.button}
          onClick={() => {
            if (focused) pickChoice(focused.id);
          }}
        >
          {props.copy.choose}
        </button>
        <button type="button" style={props.button} onClick={() => props.onSession(pauseSession(props.session))}>
          {props.copy.pause}
        </button>
        <button type="button" style={props.button} onClick={props.onExit}>
          {props.copy.back}
        </button>
      </div>
      {view.status === "complete" ? (
        <p>
          {props.copy.points}: {view.points}. {props.copy.matched}: {view.correctCount}/{view.trialCount}. {props.copy.notHealth}
        </p>
      ) : null}
    </main>
  );
}

function note(colors: { border: string }): CSSProperties {
  return { margin: 0, padding: "0.75rem", borderLeft: `4px solid ${colors.border}` };
}

const en = {
  games: "Games",
  daily: "A short set for today",
  minutes: "minutes",
  search: "Search games",
  filters: "Filters",
  surprise: "Surprise me",
  play: "Play",
  relaxedAvailable: "Relaxed mode is available, with no time limit.",
  switchHelp: "Switch: Next, then Choose. Single tap and the keyboard work on every button. There is no running scan timer.",
  settings: "Settings",
  timer: "Show a brisk timer. It never ends the round, and Relaxed ignores it.",
  pace: "Pace",
  relaxed: "Relaxed",
  standard: "Standard",
  brisk: "Brisk",
  text: "Text size",
  textDefault: "Default",
  textLarge: "Large, 200 percent",
  textExtra: "Extra large",
  next: "Next",
  choose: "Choose",
  pause: "Pause",
  back: "Back to games",
  points: "Points for finishing",
  matched: "Choices that matched",
  notHealth: "These numbers stay in Games and do not describe health or travel.",
};

const fr: typeof en = {
  games: "Jeux",
  daily: "Une courte série pour aujourd'hui",
  minutes: "minutes",
  search: "Chercher un jeu",
  filters: "Filtres",
  surprise: "Surprenez-moi",
  play: "Jouer",
  relaxedAvailable: "Le mode détendu est offert, sans limite de temps.",
  switchHelp: "Contacteur : Suivant, puis Choisir. Un seul toucher et le clavier fonctionnent sur chaque bouton. Aucun balayage automatique.",
  settings: "Réglages",
  timer: "Afficher un minuteur vif. Il ne termine jamais la manche, et le mode détendu l'ignore.",
  pace: "Rythme",
  relaxed: "Détendu",
  standard: "Standard",
  brisk: "Vif",
  text: "Taille du texte",
  textDefault: "Par défaut",
  textLarge: "Grand, 200 pour cent",
  textExtra: "Très grand",
  next: "Suivant",
  choose: "Choisir",
  pause: "Pause",
  back: "Retour aux jeux",
  points: "Points pour avoir terminé",
  matched: "Choix correspondants",
  notHealth: "Ces nombres restent dans Jeux et ne décrivent ni la santé ni le déplacement.",
};
