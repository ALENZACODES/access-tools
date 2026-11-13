import { ROUND_DONE } from "./boundaries.js";
import { mulberry32, pick, shuffle } from "./rng.js";
import type { Choice, CreateOptions, GameMeta, GameSession, GameView, Language } from "./types.js";

const SHAPES: Record<Language, string[]> = {
  en: ["circle", "square", "triangle", "star"],
  fr: ["cercle", "carré", "triangle", "étoile"],
};

const WORDS: Record<Language, string[]> = {
  en: ["maple", "lake", "train", "market", "cedar", "bridge", "island", "lantern"],
  fr: ["érable", "lac", "train", "marché", "cèdre", "pont", "île", "lanterne"],
};

interface Pair {
  left: string;
  right: string;
}

interface LargerProblem {
  left: string;
  right: string;
  answer: "left" | "right";
}

interface Sentence {
  words: { id: string; label: string }[];
  wrongId: string;
}

interface OddSet {
  items: { id: string; label: string }[];
  oddId: string;
}

const LARGER: LargerProblem[] = [
  { left: "3 + 4", right: "8", answer: "right" },
  { left: "1/2", right: "0.25", answer: "left" },
  { left: "12", right: "9 + 2", answer: "left" },
  { left: "6 × 2", right: "10", answer: "left" },
  { left: "15 − 5", right: "11", answer: "right" },
  { left: "0.5", right: "1/4", answer: "left" },
];

const SENTENCES: Record<Language, Sentence[]> = {
  en: [
    sentence(["The", "bus", "waited", "at", "the", "stop", "and", "the", "ramp", "was", "a", "violin"], "violin"),
    sentence(["She", "packed", "a", "coat", "a", "key", "and", "a", "thunderstorm"], "thunderstorm"),
    sentence(["The", "library", "opens", "at", "nine", "and", "closes", "a", "bicycle"], "bicycle"),
  ],
  fr: [
    sentence(["Le", "train", "est", "arrivé", "à", "la", "gare", "et", "l'ascenseur", "était", "une", "soupe"], "soupe"),
    sentence(["Il", "apporte", "un", "manteau", "une", "clé", "et", "un", "orage"], "orage"),
    sentence(["La", "bibliothèque", "ouvre", "à", "neuf", "heures", "et", "ferme", "un", "violon"], "violon"),
  ],
};

const ODDS: Record<Language, OddSet[]> = {
  en: [
    odd(["oak", "pine", "maple", "kettle"], "kettle"),
    odd(["bus", "train", "streetcar", "pillow"], "pillow"),
    odd(["Monday", "Tuesday", "Friday", "spoon"], "spoon"),
  ],
  fr: [
    odd(["chêne", "pin", "érable", "bouilloire"], "bouilloire"),
    odd(["bus", "train", "tramway", "oreiller"], "oreiller"),
    odd(["lundi", "mardi", "vendredi", "cuillère"], "cuillère"),
  ],
};

const OUTING: Record<Language, { id: string; label: string }[]> = {
  en: [
    { id: "route", label: "Check the route" },
    { id: "charge", label: "Charge the phone" },
    { id: "snack", label: "Pack a snack" },
    { id: "lock", label: "Lock the door" },
  ],
  fr: [
    { id: "route", label: "Vérifier le trajet" },
    { id: "charge", label: "Charger le téléphone" },
    { id: "snack", label: "Apporter une collation" },
    { id: "lock", label: "Verrouiller la porte" },
  ],
};

const STOPS: Record<Language, { id: string; label: string }[]> = {
  en: [
    { id: "home", label: "Home" },
    { id: "library", label: "Library" },
    { id: "park", label: "Park" },
    { id: "cafe", label: "Cafe" },
  ],
  fr: [
    { id: "home", label: "Maison" },
    { id: "library", label: "Bibliothèque" },
    { id: "park", label: "Parc" },
    { id: "cafe", label: "Café" },
  ],
};

const LINKS: Record<string, string[]> = {
  home: ["library", "park"],
  library: ["home", "cafe"],
  park: ["home", "cafe"],
  cafe: ["library", "park"],
};

function sentence(words: string[], wrong: string): Sentence {
  return {
    words: words.map((label, index) => ({ id: `${label}-${index}`, label })),
    wrongId: `${wrong}-${words.indexOf(wrong)}`,
  };
}

function odd(labels: string[], oddLabel: string): OddSet {
  return {
    items: labels.map((label) => ({ id: label, label })),
    oddId: oddLabel,
  };
}

function trialCount(pace: CreateOptions["pace"], relaxed: number, standard: number, brisk: number): number {
  if (pace === "relaxed") return relaxed;
  if (pace === "brisk") return brisk;
  return standard;
}

function base(metaId: string, options: CreateOptions, data: Record<string, unknown>): GameSession {
  return {
    metaId,
    language: options.language,
    pace: options.pace,
    timerEnabled: options.timerEnabled,
    paused: false,
    correct: 0,
    answered: 0,
    done: false,
    data,
  };
}

function text(language: Language, en: string, fr: string): string {
  return language === "fr" ? fr : en;
}

function finish(session: GameSession, trials: number): GameView {
  const title = metaById(session.metaId).title[session.language];
  return {
    gameId: session.metaId,
    title,
    prompt: ROUND_DONE[session.language],
    detail: text(
      session.language,
      `Choices that matched the puzzle: ${session.correct} of ${trials}. Points for finishing: ${trials}.`,
      `Choix qui correspondaient au jeu : ${session.correct} sur ${trials}. Points pour avoir terminé : ${trials}.`,
    ),
    choices: [],
    status: "complete",
    paused: false,
    announcement: ROUND_DONE[session.language],
    correctCount: session.correct,
    trialCount: trials,
    points: trials,
    timerVisible: false,
  };
}

function pausedView(session: GameSession, title: string): GameView {
  return {
    gameId: session.metaId,
    title,
    prompt: text(session.language, "Paused. Nothing is lost.", "Pause. Rien n'est perdu."),
    detail: text(session.language, "Resume when you want. There is no penalty.", "Reprenez quand vous voulez. Il n'y a pas de pénalité."),
    choices: [{ id: "resume", label: text(session.language, "Resume", "Reprendre") }],
    status: "playing",
    paused: true,
    announcement: text(session.language, "Paused.", "En pause."),
    correctCount: session.correct,
    trialCount: session.answered,
    points: 0,
    timerVisible: false,
  };
}

function shell(session: GameSession, prompt: string, detail: string, choices: Choice[], trials: number): GameView {
  if (session.paused) return pausedView(session, metaById(session.metaId).title[session.language]);
  if (session.done) return finish(session, trials);
  const timerVisible = session.timerEnabled && session.pace === "brisk" && session.metaId !== "quiet-count";
  return {
    gameId: session.metaId,
    title: metaById(session.metaId).title[session.language],
    prompt,
    detail: timerVisible
      ? `${detail} ${text(session.language, "A brisk timer is on. You can turn it off. It does not end the round.", "Un minuteur vif est activé. Vous pouvez le fermer. Il ne termine pas la manche.")}`
      : detail,
    choices,
    status: "playing",
    paused: false,
    announcement: prompt,
    correctCount: session.correct,
    trialCount: trials,
    points: 0,
    timerVisible,
  };
}

export const CATALOG: readonly GameMeta[] = [
  meta("same-or-different", "speed", "Same or Different Symbols", "Symboles pareils ou différents", "Two named symbols. Say whether they match. Words carry the meaning, not colour.", "Deux symboles nommés. Dites s'ils sont pareils. Les mots portent le sens, pas la couleur.", 3, false, true, false, false, false),
  meta("card-two-back", "memory", "Card Two Back", "Carte deux avant", "A word appears. Say whether it matches the word from two cards ago.", "Un mot apparaît. Dites s'il est le même que le mot d'il y a deux cartes.", 4, false, false, true, false, false),
  meta("lit-tiles", "memory", "Remember the Lit Tiles", "Retenir les cases allumées", "Study named cells, then select them. The list is text, row and column.", "Étudiez les cases nommées, puis sélectionnez-les. La liste est du texte, rangée et colonne.", 3, false, true, false, false, true),
  meta("odd-symbol", "attention", "Find the Odd Symbol Out", "Trouver l'intrus", "Most words belong together. Pick the one that does not.", "La plupart des mots vont ensemble. Choisissez celui qui ne va pas.", 3, true, true, true, false, false),
  meta("word-or-frame", "flexibility", "Word or Frame", "Mot ou cadre", "A word names a shape, and a frame is another shape. Follow the rule that is written out.", "Un mot nomme une forme, et un cadre est une autre forme. Suivez la règle écrite.", 4, false, false, true, false, false),
  meta("which-is-larger", "math", "Which Side Is Larger", "Quel côté est plus grand", "Compare two amounts. There is no clock in Relaxed.", "Comparez deux quantités. Il n'y a pas d'horloge en mode Détendu.", 3, false, true, false, true, false),
  meta("outing-order", "problem_solving", "Pack for an Outing", "Préparer une sortie", "Put four ordinary steps into one workable order. You can reveal that order.", "Mettez quatre étapes ordinaires dans un ordre qui fonctionne. Vous pouvez afficher cet ordre.", 3, true, true, true, false, true),
  meta("visit-each-stop", "attention", "Visit Each Stop Once", "Visiter chaque arrêt une fois", "A tiny made-up route. Visit each stop once, using only the links that are written down.", "Un petit trajet inventé. Visitez chaque arrêt une fois, seulement par les liens écrits.", 4, true, false, false, false, true),
  meta("extra-word", "language", "Spot the Wrong Word", "Repérer le mot qui cloche", "A short original sentence has one word that does not belong.", "Une courte phrase originale contient un mot qui ne va pas.", 3, true, true, true, false, false),
  meta("quiet-count", "wellbeing", "Quiet Count", "Compte tranquille", "Count at your own pace. This is a pause, not a breathing treatment.", "Comptez à votre rythme. C'est une pause, pas un exercice respiratoire.", 2, true, true, false, true, false),
];

function meta(
  id: string,
  area: GameMeta["area"],
  enTitle: string,
  frTitle: string,
  enSummary: string,
  frSummary: string,
  minutes: number,
  calm: boolean,
  short: boolean,
  words: boolean,
  numbers: boolean,
  puzzle: boolean,
): GameMeta {
  return {
    id,
    area,
    title: { en: enTitle, fr: frTitle },
    summary: { en: enSummary, fr: frSummary },
    estimatedMinutes: minutes,
    calm,
    short,
    words,
    numbers,
    puzzle,
  };
}

export function metaById(id: string): GameMeta {
  const found = CATALOG.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown game ${id}`);
  return found;
}

export function createSession(id: string, options: CreateOptions): GameSession {
  const rng = mulberry32(options.seed);
  switch (id) {
    case "same-or-different": {
      const names = SHAPES[options.language];
      const count = trialCount(options.pace, 4, 6, 8);
      const pairs: Pair[] = [];
      for (let index = 0; index < count; index += 1) {
        const left = pick(rng, names);
        const right = index % 2 === 0 ? left : pick(rng, names.filter((name) => name !== left));
        pairs.push({ left, right });
      }
      return base(id, options, { pairs, index: 0 });
    }
    case "card-two-back": {
      const count = trialCount(options.pace, 6, 8, 10);
      const sequence = Array.from({ length: count }, () => pick(rng, WORDS[options.language]));
      const remembered = sequence[1];
      if (remembered !== undefined) sequence[3] = remembered;
      return base(id, options, { sequence, index: 0 });
    }
    case "lit-tiles": {
      const size = options.pace === "relaxed" ? 3 : 4;
      const cells = size * size;
      const litCount = options.pace === "brisk" ? 5 : 3;
      const lit: number[] = [];
      while (lit.length < litCount) {
        const cell = Math.floor(rng() * cells);
        if (!lit.includes(cell)) lit.push(cell);
      }
      return base(id, options, { size, lit, phase: "study", selected: [] as number[] });
    }
    case "odd-symbol": {
      const sets = shuffle(rng, ODDS[options.language]).slice(0, trialCount(options.pace, 2, 3, 3));
      return base(id, options, { sets, index: 0 });
    }
    case "word-or-frame": {
      const names = SHAPES[options.language];
      const count = trialCount(options.pace, 4, 6, 8);
      const trials = Array.from({ length: count }, (_, index) => ({
        word: pick(rng, names),
        frame: pick(rng, names),
        rule: index % 2 === 0 ? "word" : "frame",
      }));
      return base(id, options, { trials, index: 0 });
    }
    case "which-is-larger": {
      const count = trialCount(options.pace, 3, 4, 6);
      return base(id, options, { problems: shuffle(rng, LARGER).slice(0, count), index: 0 });
    }
    case "outing-order": {
      return base(id, options, { built: [] as string[], revealed: false });
    }
    case "visit-each-stop": {
      return base(id, options, { current: "home", visited: ["home"] as string[] });
    }
    case "extra-word": {
      const sentences = shuffle(rng, SENTENCES[options.language]).slice(0, trialCount(options.pace, 2, 3, 3));
      return base(id, options, { sentences, index: 0 });
    }
    case "quiet-count": {
      return base(id, options, { target: options.pace === "brisk" ? 8 : 4, count: 0, started: false });
    }
    default:
      throw new Error(`Unknown game ${id}`);
  }
}

export function solutionIds(session: GameSession): string[] {
  const data = session.data;
  switch (session.metaId) {
    case "same-or-different": {
      const pairs = data.pairs as Pair[];
      const index = data.index as number;
      const pair = pairs[index];
      if (!pair) return [];
      return [pair.left === pair.right ? "same" : "different"];
    }
    case "card-two-back": {
      const sequence = data.sequence as string[];
      const index = data.index as number;
      if (index < 2) return ["next"];
      return [sequence[index] === sequence[index - 2] ? "yes" : "no"];
    }
    case "lit-tiles": {
      const lit = data.lit as number[];
      return lit.map(String);
    }
    case "odd-symbol": {
      const sets = data.sets as OddSet[];
      const current = sets[data.index as number];
      return current ? [current.oddId] : [];
    }
    case "word-or-frame": {
      const trials = data.trials as { word: string; frame: string; rule: "word" | "frame" }[];
      const trial = trials[data.index as number];
      return trial ? [trial.rule === "word" ? trial.word : trial.frame] : [];
    }
    case "which-is-larger": {
      const problems = data.problems as LargerProblem[];
      const problem = problems[data.index as number];
      return problem ? [problem.answer] : [];
    }
    case "outing-order":
      return OUTING[session.language].map((step) => step.id);
    case "visit-each-stop":
      return ["home", "library", "cafe", "park"];
    case "extra-word": {
      const sentences = data.sentences as Sentence[];
      const current = sentences[data.index as number];
      return current ? [current.wrongId] : [];
    }
    case "quiet-count":
      return ["next"];
    default:
      return [];
  }
}

function advanceBinary(session: GameSession, choiceId: string, expected: string, lengthKey: string): GameSession {
  if (session.paused || session.done) return session;
  const list = session.data[lengthKey] as unknown[];
  const index = session.data.index as number;
  const matched = choiceId === expected;
  const nextIndex = index + 1;
  const done = nextIndex >= list.length;
  return {
    ...session,
    correct: session.correct + (matched ? 1 : 0),
    answered: session.answered + 1,
    done,
    data: { ...session.data, index: nextIndex },
  };
}

export function choose(session: GameSession, choiceId: string): GameSession {
  if (session.paused) {
    return choiceId === "resume" ? { ...session, paused: false } : session;
  }
  if (session.done) return session;
  switch (session.metaId) {
    case "same-or-different":
    case "odd-symbol":
    case "word-or-frame":
    case "which-is-larger":
    case "extra-word": {
      const key =
        session.metaId === "same-or-different"
          ? "pairs"
          : session.metaId === "odd-symbol"
            ? "sets"
            : session.metaId === "word-or-frame"
              ? "trials"
              : session.metaId === "which-is-larger"
                ? "problems"
                : "sentences";
      const expected = solutionIds(session)[0];
      if (!expected) return session;
      return advanceBinary(session, choiceId, expected, key);
    }
    case "card-two-back": {
      const expected = solutionIds(session)[0];
      if (!expected) return session;
      if ((session.data.index as number) < 2 && choiceId !== "next") return session;
      return advanceBinary(session, choiceId, expected, "sequence");
    }
    case "lit-tiles":
      return chooseTiles(session, choiceId);
    case "outing-order":
      return chooseOrder(session, choiceId);
    case "visit-each-stop":
      return chooseStops(session, choiceId);
    case "quiet-count":
      return chooseQuiet(session, choiceId);
    default:
      return session;
  }
}

function chooseTiles(session: GameSession, choiceId: string): GameSession {
  const phase = session.data.phase as string;
  const lit = session.data.lit as number[];
  if (phase === "study" && choiceId === "ready") {
    return { ...session, data: { ...session.data, phase: "recall" } };
  }
  if (phase !== "recall") return session;
  if (choiceId === "reveal") {
    return { ...session, done: true, answered: 1, correct: 0, data: { ...session.data, phase: "done" } };
  }
  if (choiceId === "submit") {
    const selected = [...(session.data.selected as number[])].sort((a, b) => a - b);
    const target = [...lit].sort((a, b) => a - b);
    const matched = selected.join(",") === target.join(",");
    if (matched) {
      return { ...session, done: true, answered: 1, correct: 1, data: { ...session.data, phase: "done" } };
    }
    return { ...session, data: { ...session.data, selected: [], mismatch: true } };
  }
  const cell = Number(choiceId);
  if (!Number.isInteger(cell)) return session;
  const selected = new Set(session.data.selected as number[]);
  if (selected.has(cell)) selected.delete(cell);
  else selected.add(cell);
  return { ...session, data: { ...session.data, selected: [...selected], mismatch: false } };
}

function chooseOrder(session: GameSession, choiceId: string): GameSession {
  if (choiceId === "reveal") {
    return { ...session, done: true, answered: 1, correct: 0, data: { ...session.data, revealed: true } };
  }
  if (choiceId === "reset") {
    return { ...session, data: { ...session.data, built: [] } };
  }
  const built = [...(session.data.built as string[]), choiceId];
  const target = OUTING[session.language].map((step) => step.id);
  if (built.length === target.length) {
    const matched = built.join(",") === target.join(",");
    return {
      ...session,
      done: true,
      answered: 1,
      correct: matched ? 1 : 0,
      data: { ...session.data, built },
    };
  }
  return { ...session, data: { ...session.data, built } };
}

function chooseStops(session: GameSession, choiceId: string): GameSession {
  if (choiceId === "reveal") {
    return { ...session, done: true, answered: 1, correct: 0 };
  }
  const current = session.data.current as string;
  const visited = session.data.visited as string[];
  if (!(LINKS[current] ?? []).includes(choiceId) || visited.includes(choiceId)) {
    return { ...session, data: { ...session.data, rejected: choiceId } };
  }
  const nextVisited = [...visited, choiceId];
  const done = nextVisited.length === STOPS[session.language].length;
  return {
    ...session,
    done,
    answered: done ? 1 : session.answered,
    correct: done ? 1 : session.correct,
    data: { current: choiceId, visited: nextVisited, rejected: null },
  };
}

function chooseQuiet(session: GameSession, choiceId: string): GameSession {
  if (choiceId === "start") return { ...session, data: { ...session.data, started: true, count: 0 } };
  if (choiceId === "stop") return { ...session, done: true, answered: 1, correct: 1 };
  if (choiceId !== "next") return session;
  const count = (session.data.count as number) + 1;
  const target = session.data.target as number;
  const done = count >= target;
  return {
    ...session,
    done,
    answered: done ? 1 : 0,
    correct: done ? 1 : 0,
    data: { ...session.data, started: true, count },
  };
}

export function pauseSession(session: GameSession): GameSession {
  if (session.done) return session;
  return { ...session, paused: true };
}

export function expireTrial(session: GameSession): GameSession {
  if (!session.timerEnabled || session.pace !== "brisk" || session.paused || session.done) return session;
  if (
    session.metaId === "quiet-count" ||
    session.metaId === "outing-order" ||
    session.metaId === "visit-each-stop" ||
    session.metaId === "lit-tiles"
  ) {
    return session;
  }
  if (session.metaId === "card-two-back" && (session.data.index as number) < 2) {
    return choose(session, "next");
  }
  return choose(session, "__miss__");
}

export function viewSession(session: GameSession): GameView {
  const language = session.language;
  switch (session.metaId) {
    case "same-or-different": {
      const pairs = session.data.pairs as Pair[];
      const pair = pairs[session.data.index as number];
      const prompt = pair
        ? text(language, `Left: ${pair.left}. Right: ${pair.right}. Same or different?`, `Gauche : ${pair.left}. Droite : ${pair.right}. Pareils ou différents?`)
        : ROUND_DONE[language];
      return shell(session, prompt, text(language, "Colour is not used.", "La couleur n'est pas utilisée."), [
        { id: "same", label: text(language, "Same", "Pareils") },
        { id: "different", label: text(language, "Different", "Différents") },
      ], pairs.length);
    }
    case "card-two-back": {
      const sequence = session.data.sequence as string[];
      const index = session.data.index as number;
      const word = sequence[index];
      const early = index < 2;
      const prompt = word
        ? text(
            language,
            `Card ${index + 1} of ${sequence.length}. The word is ${word}. ${early ? "Remember it. The comparison starts on card 3." : "Does it match the word from two cards ago?"}`,
            `Carte ${index + 1} sur ${sequence.length}. Le mot est ${word}. ${early ? "Retenez-le. La comparaison commence à la carte 3." : "Est-ce le mot d'il y a deux cartes?"}`,
          )
        : ROUND_DONE[language];
      const choices = early
        ? [{ id: "next", label: text(language, "Next card", "Carte suivante") }]
        : [
            { id: "yes", label: text(language, "Yes, it matches", "Oui, c'est le même") },
            { id: "no", label: text(language, "No, it is different", "Non, c'est différent") },
          ];
      return shell(session, prompt, text(language, "Only the current word is shown.", "Seul le mot actuel est affiché."), choices, sequence.length);
    }
    case "lit-tiles":
      return tilesView(session);
    case "odd-symbol": {
      const sets = session.data.sets as OddSet[];
      const current = sets[session.data.index as number];
      const prompt = current
        ? text(language, "Which word does not belong with the others?", "Quel mot ne va pas avec les autres?")
        : ROUND_DONE[language];
      return shell(session, prompt, current ? current.items.map((item) => item.label).join(", ") : "", current?.items ?? [], sets.length);
    }
    case "word-or-frame": {
      const trials = session.data.trials as { word: string; frame: string; rule: "word" | "frame" }[];
      const trial = trials[session.data.index as number];
      const rule = trial
        ? trial.rule === "word"
          ? text(language, "Follow the word.", "Suivez le mot.")
          : text(language, "Follow the frame.", "Suivez le cadre.")
        : "";
      const prompt = trial
        ? text(
            language,
            `${rule} The word says ${trial.word}. The frame is ${trial.frame}.`,
            `${rule} Le mot dit ${trial.word}. Le cadre est ${trial.frame}.`,
          )
        : ROUND_DONE[language];
      return shell(
        session,
        prompt,
        text(language, "The rule is written in words.", "La règle est écrite en mots."),
        SHAPES[language].map((shape) => ({ id: shape, label: shape })),
        trials.length,
      );
    }
    case "which-is-larger": {
      const problems = session.data.problems as LargerProblem[];
      const problem = problems[session.data.index as number];
      const prompt = problem
        ? text(language, `Which is larger? ${problem.left} or ${problem.right}?`, `Quel est le plus grand? ${problem.left} ou ${problem.right}?`)
        : ROUND_DONE[language];
      return shell(
        session,
        prompt,
        text(language, "Pick a side. A mismatch does not take points away.", "Choisissez un côté. Une différence n'enlève pas de points."),
        problem
          ? [
              { id: "left", label: problem.left },
              { id: "right", label: problem.right },
            ]
          : [],
        problems.length,
      );
    }
    case "outing-order":
      return orderView(session);
    case "visit-each-stop":
      return stopsView(session);
    case "extra-word": {
      const sentences = session.data.sentences as Sentence[];
      const current = sentences[session.data.index as number];
      const prompt = current
        ? text(language, "Which word does not belong in this sentence?", "Quel mot ne va pas dans cette phrase?")
        : ROUND_DONE[language];
      return shell(
        session,
        prompt,
        current ? current.words.map((word) => word.label).join(" ") : "",
        current?.words.map((word) => ({ id: word.id, label: word.label })) ?? [],
        sentences.length,
      );
    }
    case "quiet-count":
      return quietView(session);
    default:
      throw new Error(`Unknown game ${session.metaId}`);
  }
}

function cellLabel(language: Language, size: number, cell: number): string {
  const row = Math.floor(cell / size) + 1;
  const column = (cell % size) + 1;
  return text(language, `Row ${row}, column ${column}`, `Rangée ${row}, colonne ${column}`);
}

function tilesView(session: GameSession): GameView {
  const language = session.language;
  const size = session.data.size as number;
  const lit = session.data.lit as number[];
  const phase = session.data.phase as string;
  const cells = Array.from({ length: size * size }, (_, cell) => cell);
  if (phase === "study") {
    const names = lit.map((cell) => cellLabel(language, size, cell)).join("; ");
    return shell(
      session,
      text(language, `Study these cells: ${names}.`, `Étudiez ces cases : ${names}.`),
      text(language, "They stay on screen until you continue. Nothing flashes.", "Elles restent à l'écran jusqu'à ce que vous continuiez. Rien ne clignote."),
      [{ id: "ready", label: text(language, "I am ready", "Je suis prêt") }],
      1,
    );
  }
  const selected = (session.data.selected as number[]) ?? [];
  const mismatch = Boolean(session.data.mismatch);
  return shell(
    session,
    text(
      language,
      mismatch ? "Those cells do not match. Nothing is lost. Try again or show the cells." : "Select the cells you studied.",
      mismatch ? "Ces cases ne correspondent pas. Rien n'est perdu. Réessayez ou affichez les cases." : "Sélectionnez les cases étudiées.",
    ),
    text(language, "Selected cells are named. The answer is not listed.", "Les cases choisies sont nommées. La réponse n'est pas affichée."),
    [
      ...cells.map((cell) => ({
        id: String(cell),
        label: `${cellLabel(language, size, cell)}${selected.includes(cell) ? text(language, " selected", " choisie") : ""}`,
      })),
      { id: "submit", label: text(language, "Check selection", "Vérifier la sélection") },
      { id: "reveal", label: text(language, "Show the cells and finish", "Afficher les cases et terminer") },
    ],
    1,
  );
}

function orderView(session: GameSession): GameView {
  const language = session.language;
  const steps = OUTING[language];
  const built = session.data.built as string[];
  const remaining = steps.filter((step) => !built.includes(step.id));
  const builtLabels = built.map((id) => steps.find((step) => step.id === id)?.label).join(", ");
  return shell(
    session,
    text(language, "Choose the next step in one workable order.", "Choisissez la prochaine étape dans un ordre qui fonctionne."),
    text(language, `So far: ${builtLabels || "nothing yet"}.`, `Jusqu'ici : ${builtLabels || "rien encore"}.`),
    [
      ...remaining.map((step) => ({ id: step.id, label: step.label })),
      { id: "reset", label: text(language, "Start the order again", "Recommencer l'ordre") },
      { id: "reveal", label: text(language, "Show one workable order and finish", "Afficher un ordre possible et terminer") },
    ],
    1,
  );
}

function stopsView(session: GameSession): GameView {
  const language = session.language;
  const stops = STOPS[language];
  const current = session.data.current as string;
  const visited = session.data.visited as string[];
  const rejected = session.data.rejected as string | null;
  const name = (id: string) => stops.find((stop) => stop.id === id)?.label ?? id;
  const links = (LINKS[current] ?? []).map(name).join(", ");
  const prompt = rejected
    ? text(language, "That stop is not connected from here. Nothing is lost.", "Cet arrêt n'est pas relié d'ici. Rien n'est perdu.")
    : text(language, `You are at ${name(current)}. Links: ${links}.`, `Vous êtes à ${name(current)}. Liens : ${links}.`);
  const choices = (LINKS[current] ?? [])
    .filter((id) => !visited.includes(id))
    .map((id) => ({ id, label: name(id) }));
  return shell(
    session,
    prompt,
    text(
      language,
      `Visited: ${visited.map(name).join(", ")}. These stops are not real places.`,
      `Visités : ${visited.map(name).join(", ")}. Ces arrêts ne sont pas de vrais lieux.`,
    ),
    [...choices, { id: "reveal", label: text(language, "Show one route and finish", "Afficher un trajet et terminer") }],
    1,
  );
}

function quietView(session: GameSession): GameView {
  const language = session.language;
  const started = Boolean(session.data.started);
  const count = session.data.count as number;
  const target = session.data.target as number;
  if (!started) {
    return shell(
      session,
      text(
        language,
        "Quiet count. This is not a breathing treatment, not therapy, and not medical advice.",
        "Compte tranquille. Ce n'est pas un exercice respiratoire, ni une thérapie, ni un avis médical.",
      ),
      text(language, `You chose ${target} counts. Go at your own pace.`, `Vous avez ${target} comptes. Allez à votre rythme.`),
      [{ id: "start", label: text(language, "Start counting", "Commencer à compter") }],
      1,
    );
  }
  return shell(
    session,
    text(language, `Count ${count} of ${target}. Tap when you want the next count.`, `Compte ${count} sur ${target}. Touchez quand vous voulez le compte suivant.`),
    text(language, "No clock is running.", "Aucune horloge ne tourne."),
    [
      { id: "next", label: text(language, "Next count", "Compte suivant") },
      { id: "stop", label: text(language, "Stop here", "Arrêter ici") },
    ],
    1,
  );
}

/** Play until complete by following the puzzle, or reveal when that is the accessible finish. */
export function playPerfect(session: GameSession): GameSession {
  let current = session;
  let guard = 0;
  while (!current.done && guard < 80) {
    guard += 1;
    const visible = viewSession(current);
    if (current.metaId === "lit-tiles" && current.data.phase === "recall") {
      for (const id of solutionIds(current)) current = choose(current, id);
      current = choose(current, "submit");
      continue;
    }
    if (current.metaId === "outing-order") {
      for (const id of solutionIds(current)) current = choose(current, id);
      continue;
    }
    if (current.metaId === "visit-each-stop") {
      const route = ["library", "cafe", "park"];
      for (const id of route) current = choose(current, id);
      continue;
    }
    if (current.metaId === "quiet-count" && !current.data.started) {
      current = choose(current, "start");
      continue;
    }
    const choice = visible.choices.find((item) => solutionIds(current).includes(item.id)) ?? visible.choices[0];
    if (!choice) break;
    current = choose(current, choice.id);
  }
  return current;
}
