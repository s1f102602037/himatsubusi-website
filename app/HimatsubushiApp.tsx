"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowDrift, KeyChorus, OrbitGuard, TypingComet } from "./KeyboardArcade";

type Category = "game" | "diagnosis" | "refresh" | "create";
type ContentId =
  | "reaction"
  | "color-clash"
  | "star-memory"
  | "typing-comet"
  | "arrow-drift"
  | "orbit-guard"
  | "key-chorus"
  | "hima-type"
  | "brain-weather"
  | "idea-gacha"
  | "bubble"
  | "breathing"
  | "binary"
  | "time-capsule";
type View = "home" | ContentId;
type TimeFilter = "all" | "1" | "3" | "10";
type ControlMode = "keyboard" | "pointer" | "mixed";

type ContentItem = {
  id: ContentId;
  category: Category;
  title: string;
  shortTitle: string;
  description: string;
  time: 1 | 3 | 10;
  icon: string;
  tone: "violet" | "coral" | "mint" | "yellow" | "blue";
  tag: string;
  control: ControlMode;
  howTo: string;
};

type Stats = {
  sparks: number;
  plays: number;
  visits: number;
  lastVisit: string;
  best: Record<string, number>;
  history: ContentId[];
  completed: Record<string, number>;
  streak: number;
  lastPlayDate: string;
  dailyDate: string;
  dailyPlays: ContentId[];
};

const DEFAULT_STATS: Stats = {
  sparks: 0,
  plays: 0,
  visits: 0,
  lastVisit: "",
  best: {},
  history: [],
  completed: {},
  streak: 0,
  lastPlayDate: "",
  dailyDate: "",
  dailyPlays: [],
};

const CONTENT: ContentItem[] = [
  {
    id: "reaction",
    category: "game",
    title: "秒速リアクション",
    shortTitle: "リアクション",
    description: "光った瞬間をつかまえる。あなたの反射神経は何ミリ秒？",
    time: 1,
    icon: "⚡",
    tone: "yellow",
    tag: "反射神経",
    control: "mixed",
    howTo: "スタート後、画面がミント色に光った瞬間にクリック・タップ、または Space キーを押します。早押しはフライングです。",
  },
  {
    id: "color-clash",
    category: "game",
    title: "カラー・クラッシュ",
    shortTitle: "カラークラッシュ",
    description: "文字ではなく、インクの色を答える30秒の脳内カーニバル。",
    time: 1,
    icon: "◉",
    tone: "coral",
    tag: "30秒勝負",
    control: "pointer",
    howTo: "大きく表示された文字の意味ではなく、文字に使われている色と同じ色のボタンを選びます。30秒の得点勝負です。",
  },
  {
    id: "star-memory",
    category: "game",
    title: "星座の記憶",
    shortTitle: "星座の記憶",
    description: "一瞬だけ光る星を覚えて、夜空に同じ星座を描こう。",
    time: 3,
    icon: "✦",
    tone: "blue",
    tag: "記憶力",
    control: "pointer",
    howTo: "最初に光る星の位置を覚え、光が消えたら同じマスをすべて選びます。レベルごとに星が増えます。",
  },
  {
    id: "typing-comet",
    category: "game",
    title: "タイピング彗星",
    shortTitle: "タイピング彗星",
    description: "ローマ字を打つほど彗星が加速。30秒のことば宇宙旅行。",
    time: 1,
    icon: "☄",
    tone: "coral",
    tag: "キーボード新作",
    control: "keyboard",
    howTo: "表示されたローマ字を左からそのまま入力します。1語を打ち切ると次の言葉へ進み、連続成功でコンボ得点が増えます。",
  },
  {
    id: "arrow-drift",
    category: "game",
    title: "アロー・ドリフト",
    shortTitle: "アロードリフト",
    description: "流れてくる矢印を方向キーで追う、指先のショートレース。",
    time: 1,
    icon: "↝",
    tone: "yellow",
    tag: "方向キー / WASD",
    control: "keyboard",
    howTo: "中央で大きく光る矢印と同じ方向キーを順番に押します。W A S D キーでも同じように操作できます。",
  },
  {
    id: "orbit-guard",
    category: "game",
    title: "オービット・ガード",
    shortTitle: "オービットガード",
    description: "宇宙船をキーで動かし、落ちる流星を読むターン制サバイバル。",
    time: 3,
    icon: "▲",
    tone: "mint",
    tag: "キー操作",
    control: "mixed",
    howTo: "方向キーまたは W A S D で宇宙船を1マス移動。押すたびに流星も1マス落ちます。星を集めつつ36ターン生き残ります。",
  },
  {
    id: "key-chorus",
    category: "game",
    title: "キー・コーラス",
    shortTitle: "キーコーラス",
    description: "A S D F の4音だけ。光った順番を覚えて星空を奏でよう。",
    time: 3,
    icon: "♫",
    tone: "blue",
    tag: "音と記憶",
    control: "mixed",
    howTo: "4つの音が光る順番を覚え、あなたの番になったら A S D F で再現します。ラウンドごとに音が1つ増えます。",
  },
  {
    id: "hima-type",
    category: "diagnosis",
    title: "暇つぶしタイプ診断",
    shortTitle: "暇タイプ診断",
    description: "6つの質問で判明。あなたの退屈との付き合い方は？",
    time: 3,
    icon: "✺",
    tone: "violet",
    tag: "4タイプ",
    control: "pointer",
    howTo: "6つの質問に直感で回答します。正解・不正解はありません。最後に今のあなたに近い暇つぶしタイプを表示します。",
  },
  {
    id: "brain-weather",
    category: "diagnosis",
    title: "今日の脳内天気",
    shortTitle: "脳内天気",
    description: "今の気分を5問で観測。心の空模様に合う過ごし方を提案。",
    time: 3,
    icon: "☁",
    tone: "blue",
    tag: "気分観測",
    control: "pointer",
    howTo: "今の感覚にいちばん近い選択肢を5問選びます。回答から脳内の空模様と短い過ごし方を提案します。",
  },
  {
    id: "idea-gacha",
    category: "create",
    title: "ひらめきガチャ",
    shortTitle: "ひらめきガチャ",
    description: "いつもの景色が少し変わる、小さなお題をカプセルから。",
    time: 1,
    icon: "⌘",
    tone: "coral",
    tag: "全24種",
    control: "pointer",
    howTo: "ガチャを回すと、日常を少しだけ変える小さなお題が1つ出ます。気に入ったお題はこの端末に保存できます。",
  },
  {
    id: "bubble",
    category: "refresh",
    title: "無限プチプチ宇宙",
    shortTitle: "プチプチ宇宙",
    description: "考えるのをやめて、惑星をぷちっ。最後まで割ると流星群。",
    time: 3,
    icon: "●",
    tone: "mint",
    tag: "無心モード",
    control: "pointer",
    howTo: "画面の惑星を好きな順番でぷちっと割ります。全部割ると流星群が現れます。音量は端末側で調整できます。",
  },
  {
    id: "breathing",
    category: "refresh",
    title: "ひと息オービット",
    shortTitle: "ひと息オービット",
    description: "光の軌道に呼吸を合わせる、60秒の小さな休憩。",
    time: 1,
    icon: "◎",
    tone: "mint",
    tag: "60秒休憩",
    control: "pointer",
    howTo: "開始したら、中央の光が大きくなる間に吸い、小さくなる間に吐きます。60秒で自動的に完了します。",
  },
  {
    id: "binary",
    category: "refresh",
    title: "究極じゃない二択",
    shortTitle: "究極じゃない二択",
    description: "どちらでもいい。でも選びたい。平和すぎる二択の連続。",
    time: 3,
    icon: "⇄",
    tone: "yellow",
    tag: "ゆる投票",
    control: "pointer",
    howTo: "どちらでもいい二択を、気分で片方ずつ選びます。選ぶと架空の投票結果が表示され、次の問いへ進みます。",
  },
  {
    id: "time-capsule",
    category: "create",
    title: "一行タイムカプセル",
    shortTitle: "一行カプセル",
    description: "今日のどうでもいいことを一行だけ、未来の自分へ残そう。",
    time: 3,
    icon: "◷",
    tone: "violet",
    tag: "端末に保存",
    control: "keyboard",
    howTo: "今日の出来事や気分を80文字以内で入力して保存します。内容は送信されず、このブラウザの端末内だけに残ります。",
  },
];

const CATEGORY_LABELS: Record<Category, string> = {
  game: "ミニゲーム",
  diagnosis: "診断",
  refresh: "気分転換",
  create: "ひらめき",
};

const VALID_IDS = new Set(CONTENT.map((item) => item.id));

function useStoredState<T>(key: string, initialValue: T, normalize?: (value: unknown) => T) {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(key);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          setValue(normalize ? normalize(parsed) : parsed as T);
        }
      } catch {
        // The experience remains fully usable if storage is unavailable.
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key, normalize]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore private-mode and storage quota errors.
    }
  }, [key, ready, value]);

  return [value, setValue] as const;
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());
}

function normalizeStats(value: unknown): Stats {
  if (!value || typeof value !== "object") return DEFAULT_STATS;
  const stored = value as Partial<Stats>;
  return {
    ...DEFAULT_STATS,
    ...stored,
    best: stored.best ?? {},
    history: Array.isArray(stored.history) ? stored.history.filter((id): id is ContentId => VALID_IDS.has(id)) : [],
    completed: stored.completed ?? {},
    dailyPlays: Array.isArray(stored.dailyPlays) ? stored.dailyPlays.filter((id): id is ContentId => VALID_IDS.has(id)) : [],
  };
}

function isPreviousDay(previous: string, current: string) {
  if (!previous || !current) return false;
  const previousDate = new Date(`${previous}T00:00:00+09:00`);
  const currentDate = new Date(`${current}T00:00:00+09:00`);
  return currentDate.getTime() - previousDate.getTime() === 86_400_000;
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

export function HimatsubushiApp() {
  const [view, setView] = useState<View>("home");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [controlFilter, setControlFilter] = useState<"all" | ControlMode>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [theme, setTheme] = useStoredState<"night" | "dawn">(
    "himanowa-theme",
    "night",
  );
  const [stats, setStats] = useStoredState<Stats>("himanowa-stats", DEFAULT_STATS, normalizeStats);
  const [toast, setToast] = useState("");
  const greeting = "今日もおつかれさま";
  const searchRef = useRef<HTMLInputElement>(null);

  const navigate = useCallback((next: View) => {
    setView(next);
    const hash = next === "home" ? "" : `#${next}`;
    window.history.pushState(null, "", `${window.location.pathname}${hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.slice(1);
      setView(VALID_IDS.has(next as ContentId) ? (next as ContentId) : "home");
    };
    const timer = window.setTimeout(onHashChange, 0);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  useEffect(() => {
    const today = todayKey();
    if (stats.lastVisit === today) return;
    setStats((current) => ({
      ...current,
      visits: current.visits + 1,
      lastVisit: today,
    }));
  }, [setStats, stats.lastVisit]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (helpOpen) setHelpOpen(false);
        else if (searchOpen) setSearchOpen(false);
        else if (view !== "home") navigate("home");
      }
      if (event.key === "/" && view === "home" && !isTypingTarget(event.target)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "?" && !isTypingTarget(event.target)) {
        event.preventDefault();
        setHelpOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, navigate, searchOpen, view]);

  const complete = useCallback(
    (id: ContentId, sparks = 10) => {
      setStats((current) => ({
        ...(() => {
          const today = todayKey();
          const sameDay = current.lastPlayDate === today;
          const dailyPlays = current.dailyDate === today ? current.dailyPlays : [];
          return {
            ...current,
            sparks: current.sparks + sparks,
            plays: current.plays + 1,
            history: [id, ...current.history.filter((item) => item !== id)].slice(0, 5),
            completed: { ...current.completed, [id]: (current.completed[id] ?? 0) + 1 },
            streak: sameDay ? current.streak : isPreviousDay(current.lastPlayDate, today) ? current.streak + 1 : 1,
            lastPlayDate: today,
            dailyDate: today,
            dailyPlays: dailyPlays.includes(id) ? dailyPlays : [...dailyPlays, id],
          };
        })(),
      }));
      setToast(`+${sparks} sparks ・ いい暇でした ✦`);
    },
    [setStats],
  );

  const saveBest = useCallback(
    (id: ContentId, score: number, lowerIsBetter = false) => {
      setStats((current) => {
        const previous = current.best[id];
        const isBetter =
          previous === undefined || (lowerIsBetter ? score < previous : score > previous);
        if (!isBetter) return current;
        return { ...current, best: { ...current.best, [id]: score } };
      });
    },
    [setStats],
  );

  const randomLaunch = useCallback(
    (minutes?: 1 | 3 | 10) => {
      const pool = minutes ? CONTENT.filter((item) => item.time <= minutes) : CONTENT;
      const picked = pool[randomIndex(pool.length)];
      navigate(picked.id);
    },
    [navigate],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return CONTENT.filter((item) => {
      const matchesTime = timeFilter === "all" || item.time <= Number(timeFilter);
      const matchesCategory = category === "all" || item.category === category;
      const matchesControl = controlFilter === "all" || item.control === controlFilter || item.control === "mixed";
      const haystack = `${item.title} ${item.description} ${item.tag}`.toLowerCase();
      return matchesTime && matchesCategory && matchesControl && (!normalized || haystack.includes(normalized));
    });
  }, [category, controlFilter, query, timeFilter]);

  const currentItem = view === "home" ? null : CONTENT.find((item) => item.id === view);

  return (
    <div className="site-shell" data-theme={theme}>
      <a className="skip-link" href="#main-content">メインコンテンツへ</a>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <header className="topbar">
        <button className="brand" onClick={() => navigate("home")} aria-label="ヒマノワ ホームへ">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>ヒマノワ</span>
        </button>
        <nav className="desktop-nav" aria-label="メインナビゲーション">
          {(["game", "diagnosis", "refresh", "create"] as Category[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                navigate("home");
                setCategory(key);
                window.setTimeout(() => document.querySelector("#library")?.scrollIntoView({ behavior: "smooth" }), 80);
              }}
            >
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="stat-pill" onClick={() => navigate("home")} aria-label={`${stats.sparks} sparks 獲得済み`}>
            <span aria-hidden="true">✦</span> {stats.sparks}
          </button>
          <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="コンテンツを検索">
            <span aria-hidden="true">⌕</span>
          </button>
          <button className="icon-button help-button" onClick={() => setHelpOpen(true)} aria-label="ヒマノワの遊び方とキー操作を開く">
            <span aria-hidden="true">?</span>
          </button>
          <button
            className="icon-button theme-toggle"
            onClick={() => setTheme(theme === "night" ? "dawn" : "night")}
            aria-label={theme === "night" ? "明るいテーマにする" : "暗いテーマにする"}
          >
            <span aria-hidden="true">{theme === "night" ? "☼" : "☾"}</span>
          </button>
        </div>
      </header>

      <main id="main-content">
        {view === "home" ? (
          <Home
            greeting={greeting}
            stats={stats}
            items={filtered}
            timeFilter={timeFilter}
            category={category}
            controlFilter={controlFilter}
            query={query}
            searchRef={searchRef}
            onQuery={setQuery}
            onTime={setTimeFilter}
            onCategory={setCategory}
            onControl={setControlFilter}
            onNavigate={navigate}
            onRandom={randomLaunch}
            onHelp={() => setHelpOpen(true)}
          />
        ) : currentItem ? (
          <Experience
            item={currentItem}
            stats={stats}
            onBack={() => navigate("home")}
            onComplete={complete}
            onBest={saveBest}
            onNavigate={navigate}
          />
        ) : null}
      </main>

      <footer className="footer">
        <button className="footer-brand" onClick={() => navigate("home")}>ヒマノワ</button>
        <p>暇は、まだ名前のない自由時間。</p>
        <p className="footer-note">記録はこの端末だけに保存されます。</p>
      </footer>

      {searchOpen && (
        <SearchPalette
          onClose={() => setSearchOpen(false)}
          onNavigate={(id) => {
            setSearchOpen(false);
            navigate(id);
          }}
        />
      )}
      {helpOpen && <HelpCenter stats={stats} onClose={() => setHelpOpen(false)} onNavigate={(id) => { setHelpOpen(false); navigate(id); }} />}
      <div className={`toast ${toast ? "is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

type HomeProps = {
  greeting: string;
  stats: Stats;
  items: ContentItem[];
  timeFilter: TimeFilter;
  category: "all" | Category;
  controlFilter: "all" | ControlMode;
  query: string;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onQuery: (value: string) => void;
  onTime: (value: TimeFilter) => void;
  onCategory: (value: "all" | Category) => void;
  onControl: (value: "all" | ControlMode) => void;
  onNavigate: (view: View) => void;
  onRandom: (minutes?: 1 | 3 | 10) => void;
  onHelp: () => void;
};

function Home({
  greeting,
  stats,
  items,
  timeFilter,
  category,
  controlFilter,
  query,
  searchRef,
  onQuery,
  onTime,
  onCategory,
  onControl,
  onNavigate,
  onRandom,
  onHelp,
}: HomeProps) {
  const recent = stats.history
    .map((id) => CONTENT.find((item) => item.id === id))
    .filter(Boolean) as ContentItem[];

  return (
    <>
      <section className="hero page-width" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">●</span> 退屈、持ち込み歓迎</p>
          <h1 id="hero-title">暇を、<br /><em>遊びに変える。</em></h1>
          <p className="hero-lead">
            1分のすき間も、予定のない午後も。クリックでも、キーでも。何でもない時間に小さな「！」を。
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onRandom(3)}>
              3分だけ遊ぶ <span aria-hidden="true">→</span>
            </button>
            <button className="secondary-button" onClick={() => onRandom()}>
              完全おまかせ <span aria-hidden="true">↝</span>
            </button>
          </div>
          <div className="tiny-proof" aria-label="サイトのコンテンツ数">
            <span><b>{CONTENT.length}</b> の遊び</span><i />
            <span><b>0</b> 円</span><i />
            <span><b>∞</b> の暇</span>
          </div>
        </div>

        <div className="hero-orbit" aria-label="おすすめコンテンツ">
          <div className="orbit-line orbit-line-one" aria-hidden="true" />
          <div className="orbit-line orbit-line-two" aria-hidden="true" />
          <button className="orbit-card orbit-card-a" onClick={() => onNavigate("typing-comet")}>
            <span aria-hidden="true">☄</span><b>タイピング</b><small>NEW</small>
          </button>
          <button className="orbit-card orbit-card-b" onClick={() => onNavigate("hima-type")}>
            <span aria-hidden="true">✺</span><b>タイプ診断</b><small>6 Q</small>
          </button>
          <button className="orbit-card orbit-card-c" onClick={() => onNavigate("idea-gacha")}>
            <span aria-hidden="true">⌘</span><b>ひらめき</b><small>GACHA</small>
          </button>
          <button className="orbit-core" onClick={() => onRandom()} aria-label="ランダムに遊びを選ぶ">
            <span className="core-kicker">{greeting}</span>
            <strong>何して<br />遊ぶ？</strong>
            <span className="core-cta">くるっと選ぶ ↻</span>
          </button>
          <span className="spark spark-a" aria-hidden="true">✦</span>
          <span className="spark spark-b" aria-hidden="true">✦</span>
          <span className="spark spark-c" aria-hidden="true">·</span>
        </div>
      </section>

      <KeyboardLab onNavigate={onNavigate} />

      <section className="quick-strip" aria-label="時間で選ぶ">
        <div className="page-width quick-inner">
          <p><span aria-hidden="true">◷</span> 今、何分ある？</p>
          <div className="segmented">
            {(["1", "3", "10", "all"] as TimeFilter[]).map((value) => (
              <button
                key={value}
                className={timeFilter === value ? "is-active" : ""}
                onClick={() => onTime(value)}
                aria-pressed={timeFilter === value}
              >
                {value === "all" ? "気にしない" : `${value}分`}
              </button>
            ))}
          </div>
          <button className="surprise-link" onClick={() => onRandom(timeFilter === "all" ? undefined : Number(timeFilter) as 1 | 3 | 10)}>
            この条件でおまかせ <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>

      <section className="library page-width" id="library" aria-labelledby="library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CHOOSE YOUR DETOUR</p>
            <h2 id="library-title">寄り道を選ぶ</h2>
          </div>
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">遊びを検索</span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="気分や遊びを検索…"
            />
            <kbd>/</kbd>
          </label>
        </div>
        <div className="category-tabs" role="group" aria-label="カテゴリーで絞り込む">
          <button className={category === "all" ? "is-active" : ""} onClick={() => onCategory("all")} aria-pressed={category === "all"}>ぜんぶ</button>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => (
            <button key={key} className={category === key ? "is-active" : ""} onClick={() => onCategory(key)} aria-pressed={category === key}>
              {CATEGORY_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="control-tabs" role="group" aria-label="操作方法で絞り込む">
          <span>操作で選ぶ</span>
          {(["all", "keyboard", "pointer"] as const).map((mode) => (
            <button key={mode} className={controlFilter === mode ? "is-active" : ""} onClick={() => onControl(mode)} aria-pressed={controlFilter === mode}>
              {mode === "all" ? "すべて" : mode === "keyboard" ? "⌨ キーで遊ぶ" : "◎ クリック・タップ"}
            </button>
          ))}
        </div>

        {items.length ? (
          <div className="content-grid">
            {items.map((item, index) => (
              <ContentCard key={item.id} item={item} index={index} onOpen={() => onNavigate(item.id)} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">☄</span>
            <h3>その暇、まだ未発見です</h3>
            <p>検索ワードや絞り込みを少しゆるめてみてください。</p>
            <button className="secondary-button" onClick={() => { onQuery(""); onCategory("all"); onControl("all"); onTime("all"); }}>条件をリセット</button>
          </div>
        )}
      </section>

      <section className="dashboard page-width" aria-labelledby="dashboard-title">
        <DailyMission stats={stats} onNavigate={onNavigate} />
        <div className="stats-card">
          <p className="eyebrow">YOUR LITTLE UNIVERSE</p>
          <h2>暇の足あと</h2>
          <div className="stat-grid">
            <div><strong>{stats.plays}</strong><span>遊んだ回数</span></div>
            <div><strong>{stats.sparks}</strong><span>sparks</span></div>
            <div><strong>{stats.streak}</strong><span>連続プレイ日</span></div>
          </div>
          {recent.length > 0 && (
            <div className="recent-list">
              <span>最近の寄り道</span>
              {recent.slice(0, 3).map((item) => (
                <button key={item.id} onClick={() => onNavigate(item.id)} title={item.title}>{item.icon}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      <AchievementShelf stats={stats} onHelp={onHelp} />

      <section className="manifesto">
        <div className="page-width manifesto-inner">
          <span className="giant-quote" aria-hidden="true">“</span>
          <p>役に立たない時間が、<br /><em>あなたを戻してくれる</em>こともある。</p>
          <span className="orbit-doodle" aria-hidden="true"><i /><b>✦</b></span>
        </div>
      </section>
    </>
  );
}

const KEYBOARD_IDS: ContentId[] = ["typing-comet", "arrow-drift", "orbit-guard", "key-chorus"];

function KeyboardLab({ onNavigate }: { onNavigate: (view: View) => void }) {
  const games = CONTENT.filter((item) => KEYBOARD_IDS.includes(item.id));
  return (
    <section className="keyboard-lab" aria-labelledby="keyboard-lab-title">
      <div className="page-width keyboard-lab-inner">
        <div className="lab-copy">
          <p className="eyebrow"><span aria-hidden="true">●</span> NEW PLAYGROUND</p>
          <h2 id="keyboard-lab-title">指先から、<br /><em>暇が動きだす。</em></h2>
          <p>クリックの次は、キーで寄り道。打つ、よける、追いかける、奏でる。4つの新作は1分から始められます。</p>
          <button className="primary-button lab-launch" onClick={() => onNavigate("typing-comet")}>KEYBOARD LABへ <span aria-hidden="true">→</span></button>
        </div>
        <div className="lab-console">
          <div className="lab-console-top"><span>HIMANOWA KEYBOARD LAB</span><i>LIVE</i></div>
          <div className="giant-keys" aria-hidden="true"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>
          <div className="lab-game-list">
            {games.map((game, index) => (
              <button key={game.id} onClick={() => onNavigate(game.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><i aria-hidden="true">{game.icon}</i><b>{game.shortTitle}</b><small>{game.time} MIN</small><em aria-hidden="true">↗</em>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyMission({ stats, onNavigate }: { stats: Stats; onNavigate: (view: View) => void }) {
  const playedToday = stats.dailyDate === todayKey() ? stats.dailyPlays : [];
  const keyboardDone = playedToday.some((id) => KEYBOARD_IDS.includes(id));
  const varietyDone = playedToday.length >= 3;
  const completed = Number(keyboardDone) + Number(varietyDone);
  return (
    <div className="daily-card mission-card">
      <div className="daily-copy">
        <p className="eyebrow">TODAY&apos;S TINY MISSIONS</p>
        <h2 id="dashboard-title">今日の寄り道ミッション</h2>
        <div className="mission-list">
          <button className={keyboardDone ? "is-done" : ""} onClick={() => onNavigate("arrow-drift")}>
            <span aria-hidden="true">{keyboardDone ? "✓" : "⌨"}</span><div><b>キーを使う遊びを1回</b><small>{keyboardDone ? "クリア！" : "新しい指先の寄り道へ"}</small></div><i>{keyboardDone ? "1/1" : "0/1"}</i>
          </button>
          <button className={varietyDone ? "is-done" : ""} onClick={() => onNavigate("brain-weather")}>
            <span aria-hidden="true">{varietyDone ? "✓" : "✦"}</span><div><b>違う遊びを3種類</b><small>{playedToday.length}/3 種類を体験</small></div><i>{Math.min(playedToday.length, 3)}/3</i>
          </button>
        </div>
      </div>
      <div className="mission-orbit" aria-label={`今日のミッション ${completed}/2 完了`}><span>{completed}<small>/2</small></span><i /><b>DAILY</b></div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { id: "first", icon: "✦", title: "はじめの一歩", text: "遊びを1回完了", unlocked: (stats: Stats) => stats.plays >= 1 },
  { id: "keys", icon: "⌨", title: "キーの旅人", text: "キー遊びを3種類体験", unlocked: (stats: Stats) => KEYBOARD_IDS.filter((id) => (stats.completed[id] ?? 0) > 0).length >= 3 },
  { id: "spark", icon: "☄", title: "ひま銀河", text: "300 sparksを集める", unlocked: (stats: Stats) => stats.sparks >= 300 },
  { id: "streak", icon: "◷", title: "三日月ループ", text: "3日連続で遊ぶ", unlocked: (stats: Stats) => stats.streak >= 3 },
  { id: "collector", icon: "◎", title: "寄り道コレクター", text: "7種類の遊びを体験", unlocked: (stats: Stats) => Object.keys(stats.completed).length >= 7 },
];

function AchievementShelf({ stats, onHelp }: { stats: Stats; onHelp: () => void }) {
  const unlocked = ACHIEVEMENTS.filter((achievement) => achievement.unlocked(stats)).length;
  return (
    <section className="achievement-section page-width" aria-labelledby="achievement-title">
      <div className="achievement-heading"><div><p className="eyebrow">TINY CONSTELLATIONS</p><h2 id="achievement-title">暇の称号</h2></div><p>{unlocked}/{ACHIEVEMENTS.length} 解放</p></div>
      <div className="achievement-grid">
        {ACHIEVEMENTS.map((achievement) => {
          const isUnlocked = achievement.unlocked(stats);
          return <div key={achievement.id} className={isUnlocked ? "is-unlocked" : "is-locked"}><span aria-hidden="true">{isUnlocked ? achievement.icon : "?"}</span><div><b>{achievement.title}</b><small>{achievement.text}</small></div>{isUnlocked && <i>UNLOCKED</i>}</div>;
        })}
      </div>
      <p className="spark-explainer"><span aria-hidden="true">✦</span><b>sparksって？</b> 遊びを完了したときに増える、この端末だけの小さな足あとです。競争も課金もありません。 <button onClick={onHelp}>仕組みを見る</button></p>
    </section>
  );
}

function HelpCenter({ stats, onClose, onNavigate }: { stats: Stats; onClose: () => void; onNavigate: (id: ContentId) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); }, []);
  return (
    <div className="help-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="help-center" role="dialog" aria-modal="true" aria-labelledby="help-title">
        <div className="help-top"><div><p className="eyebrow">WELCOME TO HIMANOWA</p><h2 id="help-title">ヒマノワの歩き方</h2></div><button ref={closeRef} onClick={onClose} aria-label="ヘルプを閉じる">×</button></div>
        <p className="help-lead">ヒマノワは、1〜10分で遊べる小さな寄り道の集まりです。登録は不要。記録はこのブラウザだけに保存されます。</p>
        <div className="help-grid">
          <article><span aria-hidden="true">⌨</span><h3>キーでも遊べます</h3><p>「⌨ キー」表示のゲームはキーボードが主役。「⌨ / ◎」はタッチ用ボタンもあります。</p><button onClick={() => onNavigate("typing-comet")}>新作を試す →</button></article>
          <article><span aria-hidden="true">✦</span><h3>sparks は遊んだ足あと</h3><p>上手さに関係なく、遊びを終えると増えます。{stats.sparks} sparks は外部に送信されず、課金にも使いません。</p></article>
          <article><span aria-hidden="true">◷</span><h3>時間から選べます</h3><p>「1分」「3分」「10分」は目安です。途中でやめても大丈夫。Esc キーですぐホームへ戻れます。</p></article>
          <article><span aria-hidden="true">?</span><h3>迷ったら遊び方を見る</h3><p>各コンテンツの上に、目的と操作を1行で表示しています。いつでも ? キーでこの画面を開けます。</p></article>
        </div>
        <div className="shortcut-row"><span>サイトのショートカット</span><div><kbd>/</kbd> 検索</div><div><kbd>?</kbd> ヘルプ</div><div><kbd>Esc</kbd> 戻る / 閉じる</div><div><kbd>Space</kbd> 一部ゲーム開始</div></div>
      </section>
    </div>
  );
}

function ContentCard({ item, index, onOpen }: { item: ContentItem; index: number; onOpen: () => void }) {
  return (
    <article className={`content-card tone-${item.tone} ${index === 0 ? "is-featured" : ""}`}>
      <button className="card-hit-area" onClick={onOpen} aria-label={`${item.title}を開く`} />
      <div className="card-topline">
        <span>{CATEGORY_LABELS[item.category]}</span>
        <span><i aria-hidden="true">◷</i> {item.time}分</span>
      </div>
      <div className="card-icon" aria-hidden="true">{item.icon}</div>
      <div className="card-body">
        <div className="card-tags"><span className="card-tag">{item.tag}</span><span className="control-badge">{item.control === "keyboard" ? "⌨ キー" : item.control === "mixed" ? "⌨ / ◎" : "◎ タップ"}</span></div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
      <span className="card-arrow" aria-hidden="true">↗</span>
    </article>
  );
}

function Experience({
  item,
  stats,
  onBack,
  onComplete,
  onBest,
  onNavigate,
}: {
  item: ContentItem;
  stats: Stats;
  onBack: () => void;
  onComplete: (id: ContentId, sparks?: number) => void;
  onBest: (id: ContentId, score: number, lowerIsBetter?: boolean) => void;
  onNavigate: (view: View) => void;
}) {
  const suggestions = CONTENT.filter((candidate) => candidate.id !== item.id && candidate.category === item.category).slice(0, 2);

  return (
    <div className={`experience page-width tone-${item.tone}`}>
      <button className="back-button" onClick={onBack}><span aria-hidden="true">←</span> ホームへ戻る</button>
      <header className="experience-header">
        <div className="experience-icon" aria-hidden="true">{item.icon}</div>
        <div>
          <p className="eyebrow">{CATEGORY_LABELS[item.category]} ・ 約{item.time}分</p>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
        </div>
      </header>
      <div className="play-guide" aria-label="遊び方">
        <span aria-hidden="true">?</span>
        <div><b>遊び方</b><p>{item.howTo}</p></div>
        <em>{item.control === "keyboard" ? "⌨ KEYBOARD" : item.control === "mixed" ? "⌨ KEY + TOUCH" : "◎ CLICK / TOUCH"}</em>
      </div>
      <div className="experience-stage">
        <ExperienceBody item={item} stats={stats} onComplete={onComplete} onBest={onBest} />
      </div>
      <aside className="next-up" aria-label="次のおすすめ">
        <div><p className="eyebrow">STILL HAVE TIME?</p><h2>もう少し寄り道</h2></div>
        <div className="next-links">
          {suggestions.map((suggestion) => (
            <button key={suggestion.id} onClick={() => onNavigate(suggestion.id)}>
              <span aria-hidden="true">{suggestion.icon}</span><b>{suggestion.shortTitle}</b><i aria-hidden="true">→</i>
            </button>
          ))}
          <button onClick={() => onNavigate(CONTENT[randomIndex(CONTENT.length)].id)}>
            <span aria-hidden="true">↻</span><b>ランダム</b><i aria-hidden="true">→</i>
          </button>
        </div>
      </aside>
    </div>
  );
}

function ExperienceBody({ item, stats, onComplete, onBest }: {
  item: ContentItem;
  stats: Stats;
  onComplete: (id: ContentId, sparks?: number) => void;
  onBest: (id: ContentId, score: number, lowerIsBetter?: boolean) => void;
}) {
  switch (item.id) {
    case "reaction": return <ReactionGame best={stats.best.reaction} onComplete={onComplete} onBest={onBest} />;
    case "color-clash": return <ColorClash best={stats.best["color-clash"]} onComplete={onComplete} onBest={onBest} />;
    case "star-memory": return <StarMemory best={stats.best["star-memory"]} onComplete={onComplete} onBest={onBest} />;
    case "typing-comet": return <TypingComet best={stats.best["typing-comet"]} onFinish={(score) => { onBest("typing-comet", score); onComplete("typing-comet", 14 + Math.min(12, Math.floor(score / 150))); }} />;
    case "arrow-drift": return <ArrowDrift best={stats.best["arrow-drift"]} onFinish={(score) => { onBest("arrow-drift", score); onComplete("arrow-drift", 14 + Math.min(12, Math.floor(score / 120))); }} />;
    case "orbit-guard": return <OrbitGuard best={stats.best["orbit-guard"]} onFinish={(score) => { onBest("orbit-guard", score); onComplete("orbit-guard", 14 + Math.min(12, Math.floor(score / 80))); }} />;
    case "key-chorus": return <KeyChorus best={stats.best["key-chorus"]} onFinish={(score) => { onBest("key-chorus", score); onComplete("key-chorus", 14 + Math.min(12, score * 2)); }} />;
    case "hima-type": return <Diagnosis kind="hima" onComplete={onComplete} />;
    case "brain-weather": return <Diagnosis kind="weather" onComplete={onComplete} />;
    case "idea-gacha": return <IdeaGacha onComplete={onComplete} />;
    case "bubble": return <BubbleUniverse onComplete={onComplete} />;
    case "breathing": return <BreathingOrbit onComplete={onComplete} />;
    case "binary": return <TinyBinary onComplete={onComplete} />;
    case "time-capsule": return <TimeCapsule onComplete={onComplete} />;
  }
}

function ReactionGame({ best, onComplete, onBest }: {
  best?: number;
  onComplete: (id: ContentId, sparks?: number) => void;
  onBest: (id: ContentId, score: number, lowerIsBetter?: boolean) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "waiting" | "ready" | "result" | "early">("idle");
  const [result, setResult] = useState<number>();
  const startRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const start = () => {
    window.clearTimeout(timerRef.current);
    setResult(undefined);
    setPhase("waiting");
    timerRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setPhase("ready");
    }, 900 + randomIndex(2200));
  };

  const tap = () => {
    if (phase === "idle" || phase === "result" || phase === "early") return start();
    if (phase === "waiting") {
      window.clearTimeout(timerRef.current);
      setPhase("early");
      return;
    }
    if (phase === "ready") {
      const milliseconds = Math.round(performance.now() - startRef.current);
      setResult(milliseconds);
      setPhase("result");
      onBest("reaction", milliseconds, true);
      onComplete("reaction", milliseconds < 250 ? 18 : 12);
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target) || event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const label = phase === "idle" ? "タップしてスタート" : phase === "waiting" ? "まだ、まだ…" : phase === "ready" ? "いま！" : phase === "early" ? "おっと、フライング" : `${result} ms`;
  const detail = phase === "idle" ? "画面が光った瞬間にタップしてください" : phase === "waiting" ? "光るまで待って…" : phase === "ready" ? "TAP!" : phase === "early" ? "焦らず、光ってからもう一度" : result && result < 220 ? "稲妻級。目にも止まりません。" : result && result < 300 ? "かなり俊敏！もう一度で記録更新？" : "肩の力を抜くと速くなるかも。";

  return (
    <div className="game-wrap">
      <div className="score-line"><span>PERSONAL BEST</span><strong>{best ? `${best} ms` : "—"}</strong></div>
      <button className={`reaction-pad phase-${phase}`} onClick={tap}>
        <span className="reaction-rings" aria-hidden="true"><i /><i /><i /></span>
        <strong>{label}</strong><small>{detail}</small>
      </button>
      <p className="stage-hint">マウス・タッチ・<kbd>Space</kbd> で遊べます。フライングも記録には残りません。</p>
    </div>
  );
}

const COLORS = [
  { key: "red", label: "あか", hex: "#ff6b6b" },
  { key: "blue", label: "あお", hex: "#5aa9ff" },
  { key: "yellow", label: "きいろ", hex: "#ffd166" },
  { key: "green", label: "みどり", hex: "#5ee6c4" },
];

function ColorClash({ best, onComplete, onBest }: {
  best?: number;
  onComplete: (id: ContentId, sparks?: number) => void;
  onBest: (id: ContentId, score: number, lowerIsBetter?: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [word, setWord] = useState(0);
  const [ink, setInk] = useState(1);
  const finishedRef = useRef(false);

  const next = () => {
    const nextInk = randomIndex(COLORS.length);
    let nextWord = randomIndex(COLORS.length);
    if (nextWord === nextInk) nextWord = (nextWord + 1) % COLORS.length;
    setInk(nextInk);
    setWord(nextWord);
  };

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPlaying(false);
    onBest("color-clash", score);
    onComplete("color-clash", 12 + Math.min(10, Math.floor(score / 5)));
  }, [onBest, onComplete, score]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setTime((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (playing && time <= 0) finish();
  }, [finish, playing, time]);

  const start = () => {
    setScore(0); setCombo(0); setTime(30); finishedRef.current = false; next(); setPlaying(true);
  };

  const answer = (index: number) => {
    if (!playing) return;
    if (index === ink) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setScore((current) => current + 1 + (nextCombo % 5 === 0 ? 2 : 0));
    } else {
      setCombo(0);
      setScore((current) => Math.max(0, current - 1));
    }
    next();
  };

  return (
    <div className="game-wrap color-game">
      <div className="game-scorebar"><div><span>TIME</span><strong>{time}</strong></div><div><span>SCORE</span><strong>{score}</strong></div><div><span>BEST</span><strong>{best ?? "—"}</strong></div></div>
      {!playing ? (
        <div className="game-intro">
          <div className="mini-demo"><span style={{ color: COLORS[1].hex }}>あか</span><b>→</b><em>答えは「あお」</em></div>
          <h2>{time === 0 ? `${score} points!` : "文字に、だまされないで。"}</h2>
          <p>表示された文字の意味ではなく、文字そのものの色を選びます。</p>
          <button className="primary-button" onClick={start}>{time === 0 ? "もう一度" : "30秒スタート"}</button>
        </div>
      ) : (
        <>
          <div className="color-word" style={{ color: COLORS[ink].hex }}>{COLORS[word].label}</div>
          <div className="combo" aria-live="polite">{combo >= 2 ? `${combo} COMBO ✦` : "色を選んで！"}</div>
          <div className="color-options">
            {COLORS.map((color, index) => <button key={color.key} style={{ "--swatch": color.hex } as React.CSSProperties} onClick={() => answer(index)}><i aria-hidden="true" />{color.label}</button>)}
          </div>
        </>
      )}
    </div>
  );
}

function StarMemory({ best, onComplete, onBest }: {
  best?: number;
  onComplete: (id: ContentId, sparks?: number) => void;
  onBest: (id: ContentId, score: number, lowerIsBetter?: boolean) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "failed">("idle");
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const beginRound = (nextRound: number) => {
    const size = Math.min(2 + nextRound, 8);
    const cells = Array.from({ length: 16 }, (_, index) => index).sort(() => randomIndex(3) - 1).slice(0, size);
    setRound(nextRound); setPattern(cells); setSelected([]); setPhase("show");
    timerRef.current = window.setTimeout(() => setPhase("input"), Math.max(650, 1450 - nextRound * 90));
  };

  const pick = (cell: number) => {
    if (phase !== "input" || selected.includes(cell)) return;
    const nextSelected = [...selected, cell];
    setSelected(nextSelected);
    if (!pattern.includes(cell)) {
      setPhase("failed"); onBest("star-memory", round); onComplete("star-memory", 10 + round * 2); return;
    }
    if (nextSelected.length === pattern.length) timerRef.current = window.setTimeout(() => beginRound(round + 1), 500);
  };

  return (
    <div className="game-wrap star-game">
      <div className="score-line"><span>BEST CONSTELLATION</span><strong>LEVEL {best ?? 0}</strong></div>
      <div className="star-status" aria-live="polite">
        <span>LEVEL {round || 1}</span>
        <strong>{phase === "idle" ? "星の場所を覚えよう" : phase === "show" ? "光を記憶して…" : phase === "input" ? `${pattern.length - selected.length}つの星を探して` : "星がひとつ違ったみたい"}</strong>
      </div>
      <div className={`star-board phase-${phase}`}>
        {Array.from({ length: 16 }, (_, cell) => {
          const lit = phase === "show" && pattern.includes(cell);
          const picked = selected.includes(cell);
          const wrong = phase === "failed" && picked && !pattern.includes(cell);
          return <button key={cell} onClick={() => pick(cell)} className={`${lit ? "is-lit" : ""} ${picked ? "is-picked" : ""} ${wrong ? "is-wrong" : ""}`} aria-label={`${cell + 1}番の星`} disabled={phase !== "input"}><span aria-hidden="true">✦</span></button>;
        })}
      </div>
      {(phase === "idle" || phase === "failed") && <button className="primary-button" onClick={() => beginRound(1)}>{phase === "failed" ? "もう一度描く" : "夜空を見る"}</button>}
    </div>
  );
}

type QuizKind = "hima" | "weather";
type QuizQuestion = { text: string; options: { label: string; type: string }[] };

const HIMA_QUESTIONS: QuizQuestion[] = [
  { text: "予定が急に空いた。最初に浮かぶのは？", options: [{ label: "知らない場所へ行く", type: "adventure" }, { label: "何か作ってみる", type: "create" }, { label: "とことん休む", type: "chill" }, { label: "誰かに連絡する", type: "connect" }] },
  { text: "気づくと見ている動画は？", options: [{ label: "旅・都市伝説", type: "adventure" }, { label: "料理・DIY", type: "create" }, { label: "動物・ASMR", type: "chill" }, { label: "トーク・企画もの", type: "connect" }] },
  { text: "新しいアプリを開いたら？", options: [{ label: "とりあえず全部触る", type: "adventure" }, { label: "自分好みに設定する", type: "create" }, { label: "説明を読んでゆっくり", type: "chill" }, { label: "友達にも教える", type: "connect" }] },
  { text: "ちょっと嬉しい褒め言葉は？", options: [{ label: "行動力あるね", type: "adventure" }, { label: "発想が面白いね", type: "create" }, { label: "一緒にいると落ち着く", type: "chill" }, { label: "場を明るくするね", type: "connect" }] },
  { text: "部屋にひとつ増やすなら？", options: [{ label: "大きな地図", type: "adventure" }, { label: "作業机", type: "create" }, { label: "最高のクッション", type: "chill" }, { label: "大きなテーブル", type: "connect" }] },
  { text: "今ほしいのはどんな刺激？", options: [{ label: "予想外の発見", type: "adventure" }, { label: "完成させる達成感", type: "create" }, { label: "静かな余白", type: "chill" }, { label: "笑える出来事", type: "connect" }] },
];

const WEATHER_QUESTIONS: QuizQuestion[] = [
  { text: "今の頭の中に近い音は？", options: [{ label: "軽快な足音", type: "sun" }, { label: "静かな雨音", type: "cloud" }, { label: "鳴り止まない通知", type: "storm" }, { label: "遠くの音楽", type: "aurora" }] },
  { text: "今日のエネルギー残量は？", options: [{ label: "まだまだ満タン", type: "sun" }, { label: "半分くらい", type: "cloud" }, { label: "赤いランプが点滅", type: "storm" }, { label: "妙に冴えている", type: "aurora" }] },
  { text: "今、一番うれしい誘いは？", options: [{ label: "外へ遊びに行こう", type: "sun" }, { label: "お茶を飲もう", type: "cloud" }, { label: "今日は何もしなくていい", type: "storm" }, { label: "面白い話があるよ", type: "aurora" }] },
  { text: "目を閉じたとき浮かぶ色は？", options: [{ label: "まぶしい黄色", type: "sun" }, { label: "やわらかい水色", type: "cloud" }, { label: "深い群青", type: "storm" }, { label: "ゆらめく紫", type: "aurora" }] },
  { text: "このあと選ぶなら？", options: [{ label: "テンポの速いゲーム", type: "sun" }, { label: "ゆっくり深呼吸", type: "cloud" }, { label: "画面を閉じて休憩", type: "storm" }, { label: "ひらめきガチャ", type: "aurora" }] },
];

const RESULTS: Record<string, { icon: string; title: string; subtitle: string; text: string; tip: string }> = {
  adventure: { icon: "☄", title: "寄り道コメット", subtitle: "発見で充電する冒険派", text: "退屈は、まだ知らない扉の前にいるサイン。小さな変化から面白さを見つけるのが得意です。", tip: "今日の処方箋：いつもと違う道を3分だけ歩く" },
  create: { icon: "✺", title: "ひらめきクラフター", subtitle: "手を動かす創作派", text: "何もない時間ほどアイデアが育つタイプ。完成度より、まず形にすると気分がぐっと動きます。", tip: "今日の処方箋：目の前の物を主人公に一行書く" },
  chill: { icon: "☾", title: "余白ムーン", subtitle: "静けさで整える休息派", text: "暇を無理に埋めなくても大丈夫と知っている人。ゆっくりした時間が次の元気をつくります。", tip: "今日の処方箋：飲み物を一口、画面を見ずに味わう" },
  connect: { icon: "∞", title: "わいわいサテライト", subtitle: "誰かと笑う共有派", text: "面白さを分け合うほど元気になるタイプ。あなたの一言が、誰かの退屈も救っています。", tip: "今日の処方箋：最近笑ったことを誰かに送る" },
  sun: { icon: "☀", title: "快晴フルパワー", subtitle: "好奇心、よく晴れています", text: "今は動くほど楽しくなるコンディション。短い勝負や新しい挑戦と相性がよさそう。", tip: "おすすめ：カラー・クラッシュで30秒勝負" },
  cloud: { icon: "☁", title: "うす曇りスローモード", subtitle: "急がないのがちょうどいい", text: "元気はあるけれど、少しゆるめが心地よい空模様。自分のペースで静かな寄り道を。", tip: "おすすめ：一行タイムカプセル" },
  storm: { icon: "☂", title: "通り雨リセット", subtitle: "今日は回復を最優先に", text: "頭の中が少し混み合っているかも。何かを成し遂げるより、刺激を小さくする時間を。", tip: "おすすめ：ひと息オービットを60秒" },
  aurora: { icon: "◌", title: "オーロラひらめき注意報", subtitle: "不思議なアイデアが生まれそう", text: "少し落ち着かないけれど、発想は自由に飛べる状態。正解のない遊びがぴったりです。", tip: "おすすめ：ひらめきガチャを一回" },
};

function Diagnosis({ kind, onComplete }: { kind: QuizKind; onComplete: (id: ContentId, sparks?: number) => void }) {
  const questions = kind === "hima" ? HIMA_QUESTIONS : WEATHER_QUESTIONS;
  const id: ContentId = kind === "hima" ? "hima-type" : "brain-weather";
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string>();
  const [copied, setCopied] = useState(false);

  const answer = (type: string) => {
    const nextScores = { ...scores, [type]: (scores[type] ?? 0) + 1 };
    setScores(nextScores);
    if (index === questions.length - 1) {
      const winner = Object.entries(nextScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner); onComplete(id, 20);
    } else setIndex((current) => current + 1);
  };

  const restart = () => { setIndex(0); setScores({}); setResult(undefined); setCopied(false); };
  const share = async () => {
    if (!result) return;
    const text = `ヒマノワの${kind === "hima" ? "暇つぶしタイプ診断" : "脳内天気"}で「${RESULTS[result].title}」でした。`;
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  };

  if (result) {
    const detail = RESULTS[result];
    return (
      <div className="diagnosis-result">
        <div className="result-orbit" aria-hidden="true"><i /><span>{detail.icon}</span><b>✦</b></div>
        <p className="eyebrow">YOUR RESULT</p>
        <h2>{detail.title}</h2><h3>{detail.subtitle}</h3><p>{detail.text}</p>
        <div className="result-tip">{detail.tip}</div>
        <div className="result-actions"><button className="primary-button" onClick={share}>{copied ? "コピーしました ✓" : "結果をコピー"}</button><button className="secondary-button" onClick={restart}>もう一度</button></div>
      </div>
    );
  }

  const question = questions[index];
  return (
    <div className="quiz-wrap">
      <div className="quiz-progress"><span>QUESTION {index + 1} / {questions.length}</span><div><i style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div></div>
      <h2>{question.text}</h2>
      <div className="quiz-options">
        {question.options.map((option, optionIndex) => <button key={option.label} onClick={() => answer(option.type)}><span>{String.fromCharCode(65 + optionIndex)}</span>{option.label}<i aria-hidden="true">→</i></button>)}
      </div>
      <p className="stage-hint">深く考えず、いちばん近いものを選んでください。</p>
    </div>
  );
}

const PROMPTS = [
  ["観察", "今いる場所で、丸いものを5つ見つける"], ["創作", "冷蔵庫の中身にバンド名をつける"], ["散歩", "次の角まで、青いものだけ探して歩く"], ["ことば", "今日を漢字一文字で表して、理由を一行"],
  ["写真", "いちばん小さな影を撮る"], ["妄想", "目の前の物が話せたら、第一声は？"], ["音", "30秒だけ、いちばん遠い音を探す"], ["整理", "いらないスクリーンショットを3枚だけ消す"],
  ["創作", "新しい祝日をひとつ作って名前をつける"], ["観察", "部屋の中の一番古そうな物を探す"], ["ことば", "『もしも』から始まる一文を書く"], ["休憩", "肩を上げて3秒、ふっと落とす"],
  ["妄想", "今日のBGMの曲名を勝手に決める"], ["写真", "四角だけでできた景色を切り取る"], ["散歩", "いつもより10歩だけ遠くへ行く"], ["音", "机を指で叩いて4拍のリズムを作る"],
  ["観察", "今見える色を、変な名前で呼んでみる"], ["創作", "100円で売れそうな超能力を考える"], ["整理", "机の上の物をひとつだけ元の場所へ"], ["ことば", "最後に食べたものを大げさに褒める"],
  ["妄想", "窓の外に映画のタイトルをつける"], ["休憩", "目を閉じて10まで、ゆっくり数える"], ["創作", "自分だけの秘密の合言葉をつくる"], ["観察", "左右対称に見えるものを3つ探す"],
] as const;

function IdeaGacha({ onComplete }: { onComplete: (id: ContentId, sparks?: number) => void }) {
  const [prompt, setPrompt] = useState<(typeof PROMPTS)[number]>();
  const [rolling, setRolling] = useState(false);
  const [favorites, setFavorites] = useStoredState<string[]>("himanowa-ideas", []);

  const roll = () => {
    setRolling(true);
    window.setTimeout(() => {
      let next = PROMPTS[randomIndex(PROMPTS.length)];
      if (next === prompt) next = PROMPTS[(PROMPTS.indexOf(next) + 1) % PROMPTS.length];
      setPrompt(next); setRolling(false); onComplete("idea-gacha", 8);
    }, 650);
  };
  const toggleFavorite = () => {
    if (!prompt) return;
    setFavorites((current) => current.includes(prompt[1]) ? current.filter((item) => item !== prompt[1]) : [prompt[1], ...current].slice(0, 8));
  };

  return (
    <div className="gacha-wrap">
      <div className={`gacha-machine ${rolling ? "is-rolling" : ""}`} aria-hidden="true"><div className="gacha-dome"><i /><i /><i /><i /><i /></div><div className="gacha-base"><span>IDEA<br />CAPSULE</span><b>↻</b></div></div>
      <div className="gacha-result" aria-live="polite">
        {prompt ? <><span>{prompt[0]}</span><h2>{prompt[1]}</h2><button className={`favorite-button ${favorites.includes(prompt[1]) ? "is-saved" : ""}`} onClick={toggleFavorite}>{favorites.includes(prompt[1]) ? "★ 保存済み" : "☆ お気に入りに保存"}</button></> : <><span>全24種類</span><h2>退屈に、ひと粒のひらめきを。</h2><p>役に立つかはわかりません。面白くなるかもしれません。</p></>}
        <button className="primary-button" onClick={roll} disabled={rolling}>{rolling ? "カプセル落下中…" : prompt ? "もう一回まわす" : "ガチャをまわす"}</button>
      </div>
    </div>
  );
}

function BubbleUniverse({ onComplete }: { onComplete: (id: ContentId, sparks?: number) => void }) {
  const [popped, setPopped] = useState<number[]>([]);
  const [board, setBoard] = useState(0);
  const total = 40;
  const pop = (index: number) => {
    if (popped.includes(index)) return;
    const next = [...popped, index]; setPopped(next);
    if (navigator.vibrate) navigator.vibrate(12);
    playPop(180 + (index % 7) * 28);
    if (next.length === total) { setBoard((current) => current + 1); onComplete("bubble", 15); }
  };
  const reset = () => setPopped([]);
  return (
    <div className="bubble-wrap">
      <div className="bubble-toolbar"><div><span>POPPED</span><strong>{popped.length} / {total}</strong></div><div className="bubble-progress"><i style={{ width: `${(popped.length / total) * 100}%` }} /></div><button onClick={reset}>全部ふくらます ↻</button></div>
      <div className={`bubble-board ${popped.length === total ? "is-complete" : ""}`} key={board}>
        {Array.from({ length: total }, (_, index) => <button key={index} className={popped.includes(index) ? "is-popped" : ""} onClick={() => pop(index)} aria-label={`${index + 1}個目の惑星を割る`} aria-pressed={popped.includes(index)}><span aria-hidden="true" /></button>)}
        {popped.length === total && <div className="bubble-complete"><span aria-hidden="true">✦ ✦ ✦</span><strong>宇宙、すっきり。</strong><button className="primary-button" onClick={reset}>もう一面</button></div>}
      </div>
      <p className="stage-hint">音が出ます。端末によっては軽い振動も楽しめます。</p>
    </div>
  );
}

function playPop(frequency: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = "sine"; oscillator.frequency.setValueAtTime(frequency, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(70, context.currentTime + 0.08);
    gain.gain.setValueAtTime(0.09, context.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + 0.1); oscillator.onended = () => context.close();
  } catch { /* Audio is an enhancement, not a requirement. */ }
}

const BREATH_PHASES = [
  { name: "吸って", detail: "鼻からゆっくり", seconds: 4 },
  { name: "止めて", detail: "そのまま静かに", seconds: 4 },
  { name: "吐いて", detail: "細く、長く", seconds: 4 },
  { name: "止めて", detail: "次の呼吸を待つ", seconds: 4 },
];

function BreathingOrbit({ onComplete }: { onComplete: (id: ContentId, sparks?: number) => void }) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const completedRef = useRef(false);
  const phaseIndex = Math.floor((elapsed % 16) / 4);
  const phase = BREATH_PHASES[phaseIndex];

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => current - 1);
      setElapsed((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || remaining > 0) return;
    const timer = window.setTimeout(() => {
      setRunning(false);
      if (!completedRef.current) { completedRef.current = true; onComplete("breathing", 15); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [onComplete, remaining, running]);

  const start = () => { if (remaining <= 0) { setRemaining(60); setElapsed(0); completedRef.current = false; } setRunning(true); };
  const reset = () => { setRunning(false); setRemaining(60); setElapsed(0); completedRef.current = false; };
  return (
    <div className="breathing-wrap">
      <div className={`breathing-orb phase-${phaseIndex} ${running ? "is-running" : ""}`} aria-hidden="true"><i /><i /><span>◌</span></div>
      <div className="breathing-copy" aria-live="polite"><span>{remaining > 0 ? `${remaining} SEC` : "COMPLETE"}</span><h2>{remaining <= 0 ? "おかえりなさい" : running ? phase.name : "ひと息、つきませんか。"}</h2><p>{remaining <= 0 ? "60秒ぶん、少しだけ余白ができました。" : running ? phase.detail : "音は鳴りません。光の大きさに呼吸を合わせてください。"}</p></div>
      <div className="breathing-actions">{!running ? <button className="primary-button" onClick={start}>{remaining <= 0 ? "もう一周" : "60秒はじめる"}</button> : <button className="secondary-button" onClick={() => setRunning(false)}>一時停止</button>}<button className="text-button" onClick={reset}>リセット</button></div>
    </div>
  );
}

const BINARY_QUESTIONS = [
  ["ずっと靴下が少し濡れている", "ずっと袖が少し短い"], ["プリンは端から食べる", "プリンは真ん中から食べる"], ["透明になれるが、くしゃみは聞こえる", "空を飛べるが、地上1mまで"], ["ごはんに合うのは餃子", "ごはんに合うのはおでん"], ["夏が一日長くなる", "冬が一日短くなる"], ["語尾が全部『にゃ』", "歩くたびに小さく拍手が鳴る"], ["一生エレベーターがすぐ来る", "一生レジの列が最短"], ["映画の結末だけ忘れる", "曲名だけいつも思い出せない"],
] as const;

function TinyBinary({ onComplete }: { onComplete: (id: ContentId, sparks?: number) => void }) {
  const [index, setIndex] = useState(0); const [choice, setChoice] = useState<0 | 1>(); const [answered, setAnswered] = useState(0);
  const leftPercent = 39 + ((index * 17 + 11) % 23);
  const choose = (side: 0 | 1) => { if (choice !== undefined) return; setChoice(side); setAnswered((current) => current + 1); if (answered === 4) onComplete("binary", 12); };
  const next = () => { setIndex((current) => (current + 1) % BINARY_QUESTIONS.length); setChoice(undefined); };
  return (
    <div className="binary-wrap">
      <p className="binary-counter">ROUND {index + 1} ・ 回答数 {answered}</p>
      <h2>どっちを選ぶ？</h2>
      <div className={`binary-options ${choice !== undefined ? "has-choice" : ""}`}>
        {BINARY_QUESTIONS[index].map((option, side) => { const percent = side === 0 ? leftPercent : 100 - leftPercent; return <button key={option} className={choice === side ? "is-chosen" : ""} onClick={() => choose(side as 0 | 1)}><span>{side === 0 ? "A" : "B"}</span><strong>{option}</strong>{choice !== undefined && <div><b>{percent}%</b><i style={{ width: `${percent}%` }} /></div>}</button>; })}
        <span className="versus" aria-hidden="true">VS</span>
      </div>
      {choice !== undefined ? <button className="primary-button" onClick={next}>次のどうでもいい二択 →</button> : <p className="stage-hint">正解も不正解もありません。直感でどうぞ。</p>}
    </div>
  );
}

type CapsuleEntry = { date: string; text: string };

function TimeCapsule({ onComplete }: { onComplete: (id: ContentId, sparks?: number) => void }) {
  const [entries, setEntries] = useStoredState<CapsuleEntry[]>("himanowa-capsules", []);
  const [text, setText] = useState(""); const [saved, setSaved] = useState(false);
  const save = () => {
    const clean = text.trim(); if (!clean) return;
    setEntries((current) => [{ date: new Date().toISOString(), text: clean }, ...current].slice(0, 30)); setText(""); setSaved(true); onComplete("time-capsule", 12); window.setTimeout(() => setSaved(false), 2400);
  };
  return (
    <div className="capsule-wrap">
      <div className="capsule-compose"><p className="eyebrow">A NOTE TO FUTURE YOU</p><h2>今日の、どうでもいい一行。</h2><p>立派な日記じゃなくて大丈夫。忘れてしまいそうなことほど、あとで少し面白い。</p><label><span className="sr-only">今日の一行</span><textarea value={text} maxLength={80} onChange={(event) => setText(event.target.value)} placeholder="例：コンビニの新しいパンがおいしかった。" rows={3} /><small>{text.length} / 80</small></label><button className="primary-button" onClick={save} disabled={!text.trim()}>{saved ? "未来へ送りました ✓" : "カプセルに入れる"}</button></div>
      <div className="capsule-history"><div className="capsule-planet" aria-hidden="true"><i /><span>◷</span></div><h3>これまでのカプセル</h3>{entries.length ? <ul>{entries.slice(0, 5).map((entry) => <li key={entry.date}><time dateTime={entry.date}>{new Intl.DateTimeFormat("ja-JP", { month: "short", day: "numeric" }).format(new Date(entry.date))}</time><p>{entry.text}</p></li>)}</ul> : <p className="empty-note">最初の一行を入れると、ここに時間のかけらが並びます。</p>}</div>
    </div>
  );
}

function SearchPalette({ onClose, onNavigate }: { onClose: () => void; onNavigate: (id: ContentId) => void }) {
  const [query, setQuery] = useState(""); const [selected, setSelected] = useState(0); const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const matches = CONTENT.filter((item) => `${item.title}${item.description}${item.tag}`.toLowerCase().includes(query.toLowerCase()));
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setSelected((value) => Math.min(matches.length - 1, value + 1)); }
    if (event.key === "ArrowUp") { event.preventDefault(); setSelected((value) => Math.max(0, value - 1)); }
    if (event.key === "Enter" && matches[selected]) { event.preventDefault(); onNavigate(matches[selected].id); }
  };
  return (
    <div className="palette-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="palette" role="dialog" aria-modal="true" aria-labelledby="palette-title">
        <div className="palette-search"><span aria-hidden="true">⌕</span><h2 id="palette-title" className="sr-only">遊びを検索</h2><input ref={inputRef} aria-labelledby="palette-title" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(0); }} onKeyDown={onKeyDown} placeholder="何して暇をつぶす？" /><button onClick={onClose} aria-label="検索を閉じる">ESC</button></div>
        <div className="palette-results" aria-live="polite">{matches.length ? matches.map((item, index) => <button key={item.id} className={selected === index ? "is-selected" : ""} onMouseEnter={() => setSelected(index)} onClick={() => onNavigate(item.id)}><span className={`tone-dot tone-${item.tone}`}>{item.icon}</span><div><strong>{item.title}</strong><small>{CATEGORY_LABELS[item.category]} ・ {item.time}分 ・ {item.control === "keyboard" ? "キー操作" : item.control === "mixed" ? "キー / タッチ" : "クリック / タッチ"}</small></div><i aria-hidden="true">↗</i></button>) : <p className="palette-empty">見つかりませんでした。別の言葉を試してみてください。</p>}</div>
      </section>
    </div>
  );
}
