"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type KeyboardGameId = "typing-comet" | "arrow-drift" | "orbit-guard" | "key-chorus";

type ArcadeProps = {
  best?: number;
  onFinish: (score: number) => void;
};

const TYPE_WORDS = [
  { word: "hima", label: "ひま" },
  { word: "hoshi", label: "星" },
  { word: "yorimichi", label: "寄り道" },
  { word: "wakuwaku", label: "わくわく" },
  { word: "uchu", label: "宇宙" },
  { word: "hirameki", label: "ひらめき" },
  { word: "oyatsu", label: "おやつ" },
  { word: "nagareboshi", label: "流れ星" },
  { word: "fuwafuwa", label: "ふわふわ" },
  { word: "michikusa", label: "道草" },
  { word: "tanoshii", label: "たのしい" },
  { word: "niji", label: "虹" },
];

function Key({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return <kbd className={`arcade-key ${active ? "is-active" : ""}`}>{children}</kbd>;
}

function ArcadeIntro({
  eyebrow,
  title,
  text,
  keys,
  action,
  onStart,
}: {
  eyebrow: string;
  title: string;
  text: string;
  keys: string[];
  action: string;
  onStart: () => void;
}) {
  return (
    <div className="arcade-intro">
      <p className="eyebrow">{eyebrow}</p>
      <div className="intro-key-row" aria-label={`使うキー: ${keys.join("、")}`}>
        {keys.map((key) => <Key key={key}>{key}</Key>)}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary-button" onClick={onStart}>{action}</button>
    </div>
  );
}

export function TypingComet({ best, onFinish }: ArcadeProps) {
  const [phase, setPhase] = useState<"idle" | "playing" | "result">("idle");
  const [time, setTime] = useState(30);
  const [wordIndex, setWordIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [errors, setErrors] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordedRef = useRef(false);
  const currentWord = TYPE_WORDS[wordIndex];

  const start = () => {
    setPhase("playing");
    setTime(30);
    setWordIndex(Math.floor(Math.random() * TYPE_WORDS.length));
    setTyped("");
    setScore(0);
    setCombo(0);
    setErrors(0);
    recordedRef.current = false;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setTime((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" || time > 0 || recordedRef.current) return;
    recordedRef.current = true;
    setPhase("result");
    onFinish(score);
  }, [onFinish, phase, score, time]);

  const type = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
    if (!currentWord.word.startsWith(normalized)) {
      setErrors((count) => count + 1);
      setCombo(0);
      setShake(true);
      window.setTimeout(() => setShake(false), 180);
      return;
    }
    if (normalized === currentWord.word) {
      const nextCombo = combo + 1;
      setScore((points) => points + currentWord.word.length * 10 + Math.min(nextCombo, 10) * 3);
      setCombo(nextCombo);
      setTyped("");
      setWordIndex((index) => (index + 1 + Math.floor(Math.random() * (TYPE_WORDS.length - 1))) % TYPE_WORDS.length);
      return;
    }
    setTyped(normalized);
  };

  const letters = currentWord.word.split("");
  const accuracy = Math.max(0, Math.round((score / 10) / Math.max(1, score / 10 + errors) * 100));

  return (
    <div className="game-wrap typing-game">
      <div className="game-scorebar"><div><span>TIME</span><strong>{time}</strong></div><div><span>SCORE</span><strong>{score}</strong></div><div><span>BEST</span><strong>{best ?? "—"}</strong></div></div>
      {phase === "idle" ? (
        <ArcadeIntro eyebrow="TYPE TO LAUNCH" title="ことばで、彗星を飛ばそう。" text="画面のローマ字をそのまま入力。正しく打ち切るほどコンボと速度が上がります。" keys={["A", "S", "D", "F"]} action="30秒スタート" onStart={start} />
      ) : phase === "result" ? (
        <div className="arcade-result">
          <span aria-hidden="true">☄</span><p className="eyebrow">FLIGHT REPORT</p><h2>{score} points</h2>
          <div className="result-metrics"><div><strong>{combo}</strong><span>LAST COMBO</span></div><div><strong>{accuracy}%</strong><span>ACCURACY</span></div></div>
          <p>{score >= 900 ? "指先が銀河を一周しました。" : score >= 450 ? "きれいな軌道！次はもっと遠くへ。" : "最初の一文字から、もう立派な宇宙旅行。"}</p>
          <button className="primary-button" onClick={start}>もう一度飛ばす</button>
        </div>
      ) : (
        <div className={`typing-console ${shake ? "is-shaking" : ""}`}>
          <div className="typing-combo">{combo >= 2 ? `${combo} COMBO ✦` : "TYPE THE SIGNAL"}</div>
          <div className="typing-meaning">{currentWord.label}</div>
          <div className="typing-word" aria-live="polite">
            {letters.map((letter, index) => <span key={`${letter}-${index}`} className={index < typed.length ? "is-typed" : index === typed.length ? "is-current" : ""}>{letter}</span>)}
          </div>
          <label className="typing-input-label">
            <span className="sr-only">表示されたローマ字を入力</span>
            <input ref={inputRef} value={typed} onChange={(event) => type(event.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="text" aria-label={`${currentWord.word} と入力`} />
            <span aria-hidden="true">ここに入力すると彗星が加速します</span>
          </label>
        </div>
      )}
    </div>
  );
}

const ARROWS = [
  { key: "ArrowLeft", alt: "a", glyph: "←", name: "左" },
  { key: "ArrowUp", alt: "w", glyph: "↑", name: "上" },
  { key: "ArrowDown", alt: "s", glyph: "↓", name: "下" },
  { key: "ArrowRight", alt: "d", glyph: "→", name: "右" },
] as const;

function createArrowSequence(length = 32) {
  return Array.from({ length }, () => Math.floor(Math.random() * ARROWS.length));
}

export function ArrowDrift({ best, onFinish }: ArcadeProps) {
  const [phase, setPhase] = useState<"idle" | "playing" | "result">("idle");
  const [sequence, setSequence] = useState(() => createArrowSequence());
  const [position, setPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [time, setTime] = useState(25);
  const [feedback, setFeedback] = useState<"good" | "miss" | "">("");
  const recordedRef = useRef(false);

  const finish = useCallback((finalScore: number) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    setPhase("result");
    onFinish(finalScore);
  }, [onFinish]);

  const start = useCallback(() => {
    setSequence(createArrowSequence()); setPosition(0); setScore(0); setCombo(0); setMisses(0); setTime(25); setFeedback("");
    recordedRef.current = false;
    setPhase("playing");
  }, []);

  const hit = useCallback((arrowIndex: number) => {
    if (phase !== "playing") return;
    if (arrowIndex === sequence[position]) {
      const nextCombo = combo + 1;
      const nextScore = score + 10 + Math.min(20, nextCombo);
      const nextPosition = position + 1;
      setCombo(nextCombo); setScore(nextScore); setPosition(nextPosition); setFeedback("good");
      if (nextPosition >= sequence.length) finish(nextScore + time * 5);
    } else {
      setCombo(0); setMisses((value) => value + 1); setScore((value) => Math.max(0, value - 5)); setFeedback("miss");
    }
    window.setTimeout(() => setFeedback(""), 130);
  }, [combo, finish, phase, position, score, sequence, time]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((phase === "idle" || phase === "result") && event.code === "Space" && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault(); start(); return;
      }
      const index = ARROWS.findIndex((arrow) => arrow.key === event.key || arrow.alt === event.key.toLowerCase());
      if (index >= 0 && phase === "playing") { event.preventDefault(); hit(index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit, phase, start]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setTime((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => { if (phase === "playing" && time === 0) finish(score); }, [finish, phase, score, time]);

  const upcoming = sequence.slice(position, position + 7);

  return (
    <div className="game-wrap arrow-game">
      <div className="game-scorebar"><div><span>TIME</span><strong>{time}</strong></div><div><span>COMBO</span><strong>{combo}</strong></div><div><span>BEST</span><strong>{best ?? "—"}</strong></div></div>
      {phase === "idle" ? (
        <ArcadeIntro eyebrow="FOLLOW THE CURRENT" title="矢印の流れに、乗りきれる？" text="中央の矢印を順番どおり入力。方向キーでも W A S D でも遊べます。" keys={["W", "A", "S", "D"]} action="ドリフト開始" onStart={start} />
      ) : phase === "result" ? (
        <div className="arcade-result"><span aria-hidden="true">↝</span><p className="eyebrow">DRIFT COMPLETE</p><h2>{score} points</h2><p>{position}/{sequence.length} signals ・ {misses} misses</p><button className="primary-button" onClick={start}>もう一度流れに乗る</button></div>
      ) : (
        <>
          <div className={`arrow-runway feedback-${feedback}`} aria-live="polite">
            {upcoming.map((arrow, index) => <span key={`${position}-${index}`} className={index === 0 ? "is-now" : ""}>{ARROWS[arrow].glyph}</span>)}
          </div>
          <p className="arrow-counter">SIGNAL {position + 1} / {sequence.length}</p>
          <div className="arrow-controls" aria-label="画面上の方向キー">
            {ARROWS.map((arrow, index) => <button key={arrow.key} onClick={() => hit(index)} aria-label={`${arrow.name}を入力`}><Key active={sequence[position] === index}>{arrow.glyph}</Key><small>{arrow.alt.toUpperCase()}</small></button>)}
          </div>
        </>
      )}
    </div>
  );
}

type Point = { x: number; y: number };
type GuardState = { phase: "idle" | "playing" | "result"; player: Point; rocks: Point[]; star: Point; turn: number; score: number; reason: string };
const BOARD_SIZE = 6;

function randomStar(rocks: Point[], player: Point): Point {
  let point = { x: Math.floor(Math.random() * BOARD_SIZE), y: 1 + Math.floor(Math.random() * (BOARD_SIZE - 2)) };
  while (rocks.some((rock) => rock.x === point.x && rock.y === point.y) || (point.x === player.x && point.y === player.y)) {
    point = { x: Math.floor(Math.random() * BOARD_SIZE), y: 1 + Math.floor(Math.random() * (BOARD_SIZE - 2)) };
  }
  return point;
}

function initialGuardState(): GuardState {
  const player = { x: 2, y: 5 };
  const rocks = [{ x: 0, y: 0 }, { x: 3, y: 1 }, { x: 5, y: 0 }];
  return { phase: "idle", player, rocks, star: randomStar(rocks, player), turn: 0, score: 0, reason: "" };
}

export function OrbitGuard({ best, onFinish }: ArcadeProps) {
  const [game, setGame] = useState<GuardState>(initialGuardState);
  const recordedRef = useRef(false);

  const start = useCallback(() => {
    const fresh = initialGuardState();
    recordedRef.current = false;
    setGame({ ...fresh, phase: "playing" });
  }, []);

  useEffect(() => {
    if (game.phase !== "result" || recordedRef.current) return;
    recordedRef.current = true;
    onFinish(game.score);
  }, [game.phase, game.score, onFinish]);

  const move = useCallback((dx: number, dy: number) => {
    setGame((current) => {
      if (current.phase !== "playing") return current;
      const player = { x: Math.max(0, Math.min(BOARD_SIZE - 1, current.player.x + dx)), y: Math.max(0, Math.min(BOARD_SIZE - 1, current.player.y + dy)) };
      const rocks = current.rocks.map((rock, index) => rock.y >= BOARD_SIZE - 1 ? { x: (Math.floor(Math.random() * BOARD_SIZE) + index) % BOARD_SIZE, y: 0 } : { ...rock, y: rock.y + 1 });
      const hit = rocks.some((rock) => rock.x === player.x && rock.y === player.y);
      const collected = current.star.x === player.x && current.star.y === player.y;
      const turn = current.turn + 1;
      const score = current.score + (collected ? 50 : 4);
      const cleared = turn >= 36;
      return {
        phase: hit || cleared ? "result" : "playing",
        player,
        rocks,
        star: collected ? randomStar(rocks, player) : current.star,
        turn,
        score,
        reason: hit ? "流星にぶつかりました" : cleared ? "36ターンを守りきりました" : "",
      };
    });
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const direction: Record<string, [number, number]> = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowRight: [1, 0], d: [1, 0] };
      if ((game.phase === "idle" || game.phase === "result") && event.code === "Space" && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); start(); return; }
      const vector = direction[event.key];
      if (vector && game.phase === "playing") { event.preventDefault(); move(...vector); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game.phase, move, start]);

  const cells = useMemo(() => Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => ({ x: index % BOARD_SIZE, y: Math.floor(index / BOARD_SIZE) })), []);

  return (
    <div className="game-wrap guard-game">
      <div className="game-scorebar"><div><span>TURN</span><strong>{game.turn}/36</strong></div><div><span>SPARKS</span><strong>{game.score}</strong></div><div><span>BEST</span><strong>{best ?? "—"}</strong></div></div>
      {game.phase === "idle" ? (
        <ArcadeIntro eyebrow="PROTECT THE TINY ORBIT" title="小さな宇宙船を、キーで守る。" text="1キーで宇宙が1ターン進みます。流星をよけ、黄色い星を集めて36ターン生き残ろう。" keys={["↑", "←", "↓", "→"]} action="軌道へ出発" onStart={start} />
      ) : game.phase === "result" ? (
        <div className="arcade-result"><span aria-hidden="true">{game.turn >= 36 ? "✦" : "☄"}</span><p className="eyebrow">MISSION REPORT</p><h2>{game.score} sparks</h2><p>{game.reason}</p><button className="primary-button" onClick={start}>もう一度守る</button></div>
      ) : (
        <div className="guard-layout">
          <div className="guard-board" role="img" aria-label={`宇宙船は横${game.player.x + 1}、縦${game.player.y + 1}。星は横${game.star.x + 1}、縦${game.star.y + 1}`}>
            {cells.map((cell) => {
              const player = cell.x === game.player.x && cell.y === game.player.y;
              const rock = game.rocks.some((item) => item.x === cell.x && item.y === cell.y);
              const star = cell.x === game.star.x && cell.y === game.star.y;
              return <span key={`${cell.x}-${cell.y}`} className={player ? "is-ship" : rock ? "is-rock" : star ? "is-star" : ""} aria-hidden="true">{player ? "▲" : rock ? "●" : star ? "✦" : "·"}</span>;
            })}
          </div>
          <div className="guard-side">
            <p><b>▲</b> あなた</p><p><b>✦</b> 集める</p><p><b>●</b> よける</p>
            <div className="mini-dpad">
              <button onClick={() => move(0, -1)} aria-label="上へ"><Key>↑</Key></button><button onClick={() => move(-1, 0)} aria-label="左へ"><Key>←</Key></button><button onClick={() => move(0, 1)} aria-label="下へ"><Key>↓</Key></button><button onClick={() => move(1, 0)} aria-label="右へ"><Key>→</Key></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CHORUS_KEYS = [
  { key: "a", label: "A", note: "DO", color: "#ff7b74", frequency: 261.6 },
  { key: "s", label: "S", note: "MI", color: "#ffd166", frequency: 329.6 },
  { key: "d", label: "D", note: "SO", color: "#5ee6c4", frequency: 392 },
  { key: "f", label: "F", note: "TI", color: "#83a9ff", frequency: 493.9 },
];

function playNote(frequency: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.24);
    window.setTimeout(() => void context.close(), 300);
  } catch { /* Sound is an enhancement; the visual game remains complete. */ }
}

export function KeyChorus({ best, onFinish }: ArcadeProps) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "result">("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const timersRef = useRef<number[]>([]);
  const recordedRef = useRef(false);

  const clearTimers = useCallback(() => { timersRef.current.forEach((timer) => window.clearTimeout(timer)); timersRef.current = []; }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const showSequence = useCallback((notes: number[]) => {
    clearTimers(); setSequence(notes); setPosition(0); setPhase("show"); setMessage("音と光を覚えて…");
    notes.forEach((note, index) => {
      timersRef.current.push(window.setTimeout(() => { setActive(note); playNote(CHORUS_KEYS[note].frequency); }, 520 * index + 280));
      timersRef.current.push(window.setTimeout(() => setActive(null), 520 * index + 610));
    });
    timersRef.current.push(window.setTimeout(() => { setPhase("input"); setMessage("同じ順番で奏でて！"); }, 520 * notes.length + 700));
  }, [clearTimers]);

  const start = useCallback(() => { recordedRef.current = false; showSequence([Math.floor(Math.random() * CHORUS_KEYS.length)]); }, [showSequence]);

  const finish = useCallback((level: number, text: string) => {
    if (recordedRef.current) return;
    recordedRef.current = true; clearTimers(); setMessage(text); setPhase("result"); onFinish(level);
  }, [clearTimers, onFinish]);

  const press = useCallback((note: number) => {
    if (phase !== "input") return;
    setActive(note); playNote(CHORUS_KEYS[note].frequency); window.setTimeout(() => setActive(null), 180);
    if (note !== sequence[position]) { finish(Math.max(0, sequence.length - 1), "ちがう音。でも、いい即興でした。"); return; }
    if (position === sequence.length - 1) {
      const next = [...sequence, Math.floor(Math.random() * CHORUS_KEYS.length)];
      setMessage("PERFECT ✦");
      setPhase("show");
      timersRef.current.push(window.setTimeout(() => showSequence(next), 650));
    } else setPosition((value) => value + 1);
  }, [finish, phase, position, sequence, showSequence]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const index = CHORUS_KEYS.findIndex((item) => item.key === event.key.toLowerCase());
      if (index >= 0 && phase === "input") { event.preventDefault(); press(index); }
      if ((phase === "idle" || phase === "result") && event.code === "Space" && !(event.target instanceof HTMLButtonElement)) { event.preventDefault(); start(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, press, start]);

  return (
    <div className="game-wrap chorus-game">
      <div className="score-line"><span>BEST CHORUS</span><strong>LEVEL {best ?? 0}</strong></div>
      {phase === "idle" ? (
        <ArcadeIntro eyebrow="MEMORY IN FOUR NOTES" title="4つのキーで、星を奏でる。" text="光った順番を覚えて A S D F で再現。1ラウンドごとに音がひとつ増えます。" keys={["A", "S", "D", "F"]} action="最初の音を聴く" onStart={start} />
      ) : phase === "result" ? (
        <div className="arcade-result"><span aria-hidden="true">♫</span><p className="eyebrow">ENCORE?</p><h2>LEVEL {Math.max(0, sequence.length - 1)}</h2><p>{message}</p><button className="primary-button" onClick={start}>もう一度奏でる</button></div>
      ) : (
        <>
          <div className="chorus-orbit" aria-hidden="true"><i /><span>♪</span><b>{sequence.length}</b></div>
          <div className="chorus-status" aria-live="polite"><span>LEVEL {sequence.length}</span><strong>{message}</strong><small>{phase === "input" ? `${position + 1} / ${sequence.length}` : "LISTEN"}</small></div>
          <div className="chorus-keys">
            {CHORUS_KEYS.map((item, index) => <button key={item.key} onClick={() => press(index)} disabled={phase !== "input"} className={active === index ? "is-active" : ""} style={{ "--note": item.color } as React.CSSProperties}><Key active={active === index}>{item.label}</Key><span>{item.note}</span></button>)}
          </div>
          {phase === "input" && sequence.length >= 3 && <button className="text-button chorus-finish" onClick={() => finish(sequence.length, "ここまでの演奏を記録しました。")}>ここで演奏を完成にする</button>}
        </>
      )}
    </div>
  );
}
