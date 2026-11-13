import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { DAILY_NOTE, GAMES_BOUNDARY, GRACE_RULE, PRACTICE_BANNER } from "../boundaries.js";
import { TASK_FAMILY_LABEL, choose, createSession, pauseSession, viewSession } from "../engine.js";
import { HUB_FILTERS, buildDailySet, filterGames, searchGames, streakFromRounds, surpriseGame } from "../hub.js";
import { gameCopy, type GameCopyKey } from "../i18n.js";
import { stepScan } from "../scan.js";
import type { GameSession, GamesRound, GamesSettings, HubFilter, Language } from "../types.js";

const FILTER_LABEL: Record<HubFilter, GameCopyKey> = {
  all: "ui.filter-all",
  favourites: "ui.filter-favourites",
  short: "ui.filter-short",
};

function uiCopy(language: Language) {
  const text = (key: GameCopyKey) => gameCopy(key, language);
  return {
    games: text("ui.games"),
    daily: text("ui.daily"),
    replay: text("ui.replay"),
    replayNote: text("ui.replay-note"),
    streak: text("ui.streak"),
    streakCount: text("ui.streak-count"),
    graceLeft: text("ui.grace-left"),
    resetStreak: text("ui.reset-streak"),
    search: text("ui.search"),
    filters: text("ui.filters"),
    surprise: text("ui.surprise"),
    play: text("ui.play"),
    practice: text("ui.practice"),
    namesStayEnglish: text("ui.names-english"),
    switchHelp: text("ui.switch-help"),
    settings: text("ui.settings"),
    hideStreak: text("ui.hide-streak"),
    text: text("ui.text"),
    textDefault: text("ui.text-default"),
    textLarge: text("ui.text-large"),
    textExtra: text("ui.text-extra"),
    next: text("ui.next"),
    choose: text("ui.choose"),
    pause: text("ui.pause"),
    resume: text("ui.resume"),
    back: text("ui.back"),
    points: text("ui.points"),
    insideOnly: text("ui.inside-only"),
  };
}

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
  const copy = uiCopy(language);
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
          {language === "en" ? gameCopy("lang.show-french", "en") : gameCopy("lang.show-english", "en")}
        </button>
      </header>
      <p role="note" style={note(colors)}>
        {GAMES_BOUNDARY[language]}
      </p>
      <p>{copy.switchHelp}</p>
      <p>{copy.namesStayEnglish}</p>
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
        {HUB_FILTERS.map((item) => (
          <button key={item} type="button" aria-pressed={filter === item} style={button} onClick={() => setFilter(item)}>
            {gameCopy(FILTER_LABEL[item], language)}
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
  copy: ReturnType<typeof uiCopy>;
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
      <p aria-hidden={view.announcement === view.prompt ? true : undefined}>{view.prompt}</p>
      <p>{view.detail}</p>
      <div role="group" aria-labelledby={titleId} style={{ display: "grid", gap: "0.5rem" }}>
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            disabled={props.session.paused}
            aria-disabled={props.session.paused}
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
        <button type="button" style={props.button} disabled={props.session.paused} aria-disabled={props.session.paused} onClick={() => setScan(stepScan(safeScan, choices.length, 1))}>
          {props.copy.next}
        </button>
        <button type="button" style={props.button} disabled={props.session.paused} aria-disabled={props.session.paused} onClick={() => focused && pickChoice(focused.id)}>
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
          {props.copy.points}
          {gameCopy("sep.colon", props.session.language)}
          {view.points}. {props.copy.insideOnly}
        </p>
      ) : null}
    </main>
  );
}

function note(colors: { border: string }): CSSProperties {
  return { margin: 0, padding: "0.75rem", borderLeft: `4px solid ${colors.border}` };
}
