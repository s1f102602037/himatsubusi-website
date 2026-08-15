import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete Himanowa home", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /ヒマノワ/);
  assert.match(html, /暇を、/);
  assert.match(html, /遊びに変える。/);
  assert.match(html, /退屈、持ち込み歓迎/);
  assert.match(html, /秒速リアクション/);
  assert.match(html, /暇つぶしタイプ診断/);
  assert.match(html, /一行タイムカプセル/);
  assert.match(html, /14<\/b> の遊び/);
  assert.match(html, /KEYBOARD LAB/);
  assert.match(html, /タイピング彗星/);
  assert.match(html, /アロー・ドリフト/);
  assert.match(html, /オービット・ガード/);
  assert.match(html, /キー・コーラス/);
  assert.match(html, /今日の寄り道ミッション/);
  assert.match(html, /暇の称号/);
  assert.match(html, /今の気分は/);
  assert.match(html, /どっち向き？/);
  assert.match(html, /og:image/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("keeps product metadata, accessibility, and starter cleanup in place", async () => {
  const [page, layout, app, keyboardArcade, css, polishCss, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/HimatsubushiApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/KeyboardArcade.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/arcade-polish.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<HimatsubushiApp \/>/);
  assert.match(layout, /generateMetadata/);
  assert.match(layout, /x-forwarded-host/);
  assert.match(layout, /summary_large_image/);
  assert.match(packageJson, /"name": "himanowa"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  assert.match(app, /className="skip-link"/);
  assert.match(app, /aria-live="polite"/);
  assert.match(app, /himanowa-stats/);
  assert.match(app, /himanowa-capsules/);
  assert.match(app, /himanowa-stats/);
  assert.match(app, /play-guide/);
  assert.match(app, /HelpCenter/);
  assert.match(keyboardArcade, /TypingComet/);
  assert.match(keyboardArcade, /ArrowDrift/);
  assert.match(keyboardArcade, /OrbitGuard/);
  assert.match(keyboardArcade, /KeyChorus/);
  assert.match(keyboardArcade, /shi.*si/);
  assert.match(keyboardArcade, /tsu.*tu/);
  assert.match(keyboardArcade, /guard-forecast/);
  assert.match(polishCss, /card-preview/);
  assert.match(polishCss, /prefers-reduced-motion/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.site-shell\s*\{[^}]*color:\s*var\(--ink\)/s);
  assert.match(css, /\.site-shell\[data-theme="dawn"\]\s*\{[^}]*--violet-text:/s);
  assert.doesNotMatch(page + layout + app, /codex-preview|_sites-preview/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
