import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DAILY_NOTE, GAMES_BOUNDARY, GRACE_RULE, PRACTICE_BANNER } from "../boundaries.js";
import { TASK_FAMILY_LABEL, choose, createSession, pauseSession, viewSession } from "../engine.js";
import { buildDailySet, filterGames, searchGames, streakFromRounds, surpriseGame } from "../hub.js";
import { stepScan } from "../scan.js";
import type { GameSession, GamesRound, GamesSettings, HubFilter, Language } from "../types.js";

const FILTERS: HubFilter[] = ["all", "favourites", "short"];

const FILTER_LABEL: Record<HubFilter, Record<Language, string>> = {
  all: { en: "All games", fr: "Tous les jeux" },
  favourites: { en: "My favourites", fr: "Mes favoris" },
  short: { en: "Short games", fr: "Jeux courts" },
};

export interface GamesAppProps {
  settings: GamesSettings;
  rounds: GamesRound[];
  onSettings: (settings: GamesSettings) => void;
  onRound: (round: GamesRound) => void;
  onResetStreak: () => void;
  now?: Date;
  seed?: number;
}

export function GamesApp(props: GamesAppProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HubFilter>("all");
  const [active, setActive] = useState<GameSession | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [replayNote, setReplayNote] = useState(false);
  const returnFocusId = useRef<string | null>(null);
  const language = props.settings.language;
  const copy = language === "fr" ? fr : en;
  const scale = props.settings.textScale === "extra_large" ? "1.5rem" : props.settings.textScale === "large" ? "1.25rem" : "1.125rem";
  const colors =
    props.settings.contrast === "high"
      ? { background: "#000", color: "#fff", accent: "#ffe14a", border: "#fff" }
      : { background: "#fff", color: "#1a1a1a", accent: "#102a43", border: "#1a1a1a" };
  const today = (props.now ?? new Date()).toISOString().slice(0, 10);
  const streak = streakFromRounds(props.rounds, today);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (active) return;
    const id = returnFocusId.current;
    if (!id) return;
    document.getElementById(id)?.focus();
  }, [active]);

  function openGame(id: string, practice: boolean): void {
    returnFocusId.current = `play-${id}`;
    setStartedAt(new Date().toISOString());
    setActive(
      createSession(id, {
        seed: props.seed ?? 1,
        pace: "relaxed",
        language,
        timerEnabled: false,
        practice,
      }),
    );
  }

  function finishIfNeeded(session: GameSession): void {
    const view = viewSession(session);
    if (session.practice || view.status !== "complete" || !startedAt) return;
    if (props.rounds.some((round) => round.startedAt === startedAt)) return;
    props.onRound({
      schemaVersion: "games-round-1.0.0",
      roundId: crypto.randomUUID(),
      playerId: props.settings.playerId,
      gameId: session.metaId,
      pace: "relaxed",
      timerEnabled: false,
      startedAt,
      endedAt: new Date().toISOString(),
      completed: true,
      points: view.points,
      correctCount: view.correctCount,
      trialCount: view.trialCount,
    });
  }

  const frame: CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "46rem",
    overflowWrap: "anywhere",
    fontFamily: "system-ui, sans-serif",
    fontSize: scale,
    background: colors.background,
    color: colors.color,
    display: "grid",
    gap: "1rem",
  };
  const button: CSSProperties = {
    boxSizing: "border-box",
    minHeight: "48px",
    maxWidth: "100%",
    padding: "0.6rem 0.9rem",
    fontSize: "1rem",
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
  const daily = buildDailySet(today);

  return (
    <main lang={language} style={frame}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
        <h1 style={{ margin: 0 }}>{copy.games}</h1>
        <button type="button" style={button} onClick={() => props.onSettings({ ...props.settings, language: language === "en" ? "fr" : "en" })}>
          {language === "en" ? "Français" : "English"}
        </button>
      </header>
      <p role="note" style={note(colors)}>
        {GAMES_BOUNDARY[language]}
      </p>
      <p>{copy.switchHelp}</p>
      {language === "fr" ? <p>{copy.namesStayEnglish}</p> : null}
      <section aria-labelledby="daily-title">
        <h2 id="daily-title">{copy.daily}</h2>
        <p>{DAILY_NOTE[language]}</p>
        <ul>
          {daily.map((game) => (
            <li key={game.id}>{game.name}</li>
          ))}
        </ul>
        <button type="button" style={button} onClick={() => setReplayNote(true)}>
          {copy.replay}
        </button>
        {replayNote ? <p role="status">{copy.replayNote}</p> : null}
      </section>
      {!props.settings.streakOptOut ? (
        <section aria-labelledby="streak-title">
          <h2 id="streak-title">{copy.streak}</h2>
          <p>{GRACE_RULE[language]}</p>
          <p>
            {copy.streakCount} {streak.streak}. {copy.graceLeft} {streak.graceRemaining}.
          </p>
          <button type="button" style={button} onClick={props.onResetStreak}>
            {copy.resetStreak}
          </button>
        </section>
      ) : null}
      <label htmlFor="game-search">
        {copy.search}
        <input id="game-search" value={query} onChange={(event) => setQuery(event.target.value)} style={{ ...button, width: "100%", fontWeight: 400 }} />
      </label>
      <div role="group" aria-label={copy.filters} style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {FILTERS.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} style={button} onClick={() => setFilter(item)}>
            {FILTER_LABEL[item][language]}
          </button>
        ))}
      </div>
      <button type="button" style={button} onClick={() => openGame(surpriseGame(props.settings.favouriteGameIds, props.seed ?? 3).id, false)}>
        {copy.surprise}
      </button>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem" }}>
        {filtered.map((game) => (
          <li key={game.id} style={{ border: `3px solid ${colors.border}`, padding: "0.75rem", display: "grid", gap: "0.4rem", minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{game.name}</h2>
            <p style={{ margin: 0 }}>{game.summary[language]}</p>
            <p style={{ margin: 0 }}>{TASK_FAMILY_LABEL[game.taskFamily][language]}</p>
            <p style={{ margin: 0 }}>{game.timingNote[language]}</p>
            <p style={{ margin: 0 }}>{game.inputNote[language]}</p>
            <button id={`play-${game.id}`} type="button" style={button} onClick={() => openGame(game.id, false)}>
              {copy.play} {game.name}
            </button>
            <button type="button" style={button} onClick={() => openGame(game.id, true)}>
              {copy.practice} {game.name}
            </button>
          </li>
        ))}
      </ul>
      <fieldset style={{ border: `3px solid ${colors.border}`, minWidth: 0 }}>
        <legend>{copy.settings}</legend>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", minHeight: "48px" }}>
          <input
            type="checkbox"
            checked={props.settings.streakOptOut}
            onChange={(event) => props.onSettings({ ...props.settings, streakOptOut: event.target.checked })}
          />
          {copy.hideStreak}
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          {copy.text}
          <select
            value={props.settings.textScale}
            style={{ ...button, fontWeight: 400 }}
            onChange={(event) => props.onSettings({ ...props.settings, textScale: event.target.value as GamesSettings["textScale"] })}
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [scan, setScan] = useState(0);
  const choices = view.choices;
  const safeScan = choices.length === 0 ? 0 : scan % choices.length;
  const focused = choices[safeScan];

  useEffect(() => {
    headingRef.current?.focus();
  }, [props.session.metaId]);

  function pickChoice(id: string): void {
    if (props.session.paused && id !== "resume") return;
    props.onSession(choose(props.session, id));
  }

  return (
    <main lang={props.session.language} style={props.frame}>
      <h1 id={titleId} ref={headingRef} tabIndex={-1}>
        {view.title}
      </h1>
      <p role="note">{GAMES_BOUNDARY[props.session.language]}</p>
      {props.session.practice ? <p role="status">{PRACTICE_BANNER[props.session.language]}</p> : null}
      <p aria-live="polite">{view.announcement}</p>
      <p>{view.prompt}</p>
      <p>{view.detail}</p>
      <div role="group" aria-labelledby={titleId} style={{ display: "grid", gap: "0.5rem" }}>
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            style={{ ...props.button, outline: index === safeScan ? `4px solid ${props.colors.accent}` : undefined }}
            onClick={() => pickChoice(choice.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" && choices.some((item) => item.id === "left")) {
                event.preventDefault();
                pickChoice("left");
              }
              if (event.key === "ArrowRight" && choices.some((item) => item.id === "right")) {
                event.preventDefault();
                pickChoice("right");
              }
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" style={props.button} onClick={() => setScan(stepScan(safeScan, choices.length, 1))}>
          {props.copy.next}
        </button>
        <button type="button" style={props.button} onClick={() => focused && pickChoice(focused.id)}>
          {props.copy.choose}
        </button>
        <button type="button" style={props.button} onClick={() => props.onSession(pauseSession(props.session))}>
          {props.session.paused ? props.copy.resume : props.copy.pause}
        </button>
        <button type="button" style={props.button} onClick={props.onExit}>
          {props.copy.back}
        </button>
      </div>
      {view.scoreVisible ? (
        <p>
          {props.copy.points}: {view.points}. {props.copy.insideOnly}
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
  daily: "Three games for today",
  replay: "Replay today's three",
  replayNote: "Same three games for this date. Play any of them again.",
  streak: "Streak",
  streakCount: "Days in a row",
  graceLeft: "Grace days remaining",
  resetStreak: "Reset the streak on this device",
  search: "Search games",
  filters: "Filters",
  surprise: "Surprise me",
  play: "Play",
  practice: "Practice",
  namesStayEnglish: "Game names stay in English in this prototype.",
  switchHelp: "Switch: Next, then Choose. Single tap and the keyboard work on every button. There is no running scan.",
  settings: "Settings",
  hideStreak: "Hide the streak",
  text: "Text size",
  textDefault: "Default",
  textLarge: "Large",
  textExtra: "Extra large",
  next: "Next",
  choose: "Choose",
  pause: "Pause",
  resume: "Resume",
  back: "Back to games",
  points: "Points inside this exercise",
  insideOnly: "These numbers measure this exercise only.",
};

const fr: typeof en = {
  games: "Jeux",
  daily: "Trois jeux pour aujourd'hui",
  replay: "Rejouer les trois d'aujourd'hui",
  replayNote: "Les trois mêmes jeux pour cette date. Vous pouvez les rejouer.",
  streak: "Série",
  streakCount: "Jours de suite",
  graceLeft: "Jours de grâce restants",
  resetStreak: "Remettre la série à zéro sur cet appareil",
  search: "Chercher un jeu",
  filters: "Filtres",
  surprise: "Surprenez-moi",
  play: "Jouer",
  practice: "Pratiquer",
  namesStayEnglish: "Les noms des jeux restent en anglais dans cette version.",
  switchHelp: "Contacteur : Suivant, puis Choisir. Un seul toucher et le clavier fonctionnent sur chaque bouton. Aucun balayage automatique.",
  settings: "Réglages",
  hideStreak: "Masquer la série",
  text: "Taille du texte",
  textDefault: "Par défaut",
  textLarge: "Grand",
  textExtra: "Très grand",
  next: "Suivant",
  choose: "Choisir",
  pause: "Pause",
  resume: "Reprendre",
  back: "Retour aux jeux",
  points: "Points dans cet exercice",
  insideOnly: "Ces nombres mesurent seulement cet exercice.",
};
