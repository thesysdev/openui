// Bandwidth budget for the docs site (openui.com).
//
// Vercel bills the docs by bytes served and requests made, so this check opens
// key pages in a real browser and fails when a change would make them cost
// more: a page that got heavier, or a page that keeps downloading while it sits
// open (an animation that re-fetches its file on every loop, a poller, ...).
//
// For each page, with an empty cache:
//   1. load:   bytes served by the site to load the page and scroll through it
//   2. idle:   bytes served while it then stays open for idleSeconds
//   3. repeat: any file fetched again in full after it was already downloaded
//
// Usage: BASE_URL=http://localhost:3000 node check.mjs
// Budgets live in budgets.json next to this file. Raise one only on purpose.

import { appendFileSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const config = JSON.parse(readFileSync(new URL("./budgets.json", import.meta.url), "utf8"));
const IDLE_SECONDS = Number(process.env.IDLE_SECONDS ?? config.idleSeconds);
// Files smaller than this are ignored by the repeat rule (fonts, tiny icons).
const REPEAT_MIN_BYTES = 50 * 1024;

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function measure(browser, path) {
  // A very tall viewport puts every section on screen at once, so lazy content
  // loads and anything that animates only while visible runs during idle.
  const context = await browser.newContext({ viewport: { width: 1280, height: 8000 } });
  const page = await context.newPage();
  let phase = "load";
  const bytes = { load: 0, idle: 0 };
  const perFile = new Map(); // pathname -> { bytes, size }

  page.on("requestfinished", async (request) => {
    const current = phase;
    const response = await request.response().catch(() => null);
    if (!response) return;
    // Only bytes served by the docs deployment are billed to us.
    const url = new URL(request.url());
    if (url.origin !== new URL(BASE_URL).origin) return;
    const sizes = await request.sizes().catch(() => null);
    const body = sizes?.responseBodySize ?? 0;
    bytes[current] += body + (sizes?.responseHeadersSize ?? 0);

    const range = response.headers()["content-range"]; // "bytes 0-99/12345"
    const size = Number(range?.split("/")[1]) || body;
    const file = perFile.get(url.pathname) ?? { bytes: 0, size: 0 };
    file.bytes += body;
    file.size = Math.max(file.size, size);
    perFile.set(url.pathname, file);
  });

  await page.goto(BASE_URL + path, { waitUntil: "networkidle", timeout: 120_000 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2_000);

  phase = "idle";
  await page.waitForTimeout(IDLE_SECONDS * 1_000);
  await context.close();

  const repeats = [...perFile.entries()]
    .filter(([, f]) => f.size >= REPEAT_MIN_BYTES && f.bytes > f.size * 1.5)
    .map(([p, f]) => `${p} downloaded ${(f.bytes / f.size).toFixed(1)}x (${kb(f.bytes)})`);
  return { ...bytes, repeats };
}

// Real Chrome, not Playwright's Chromium: the latter cannot play H.264 video,
// so it would miss whatever a playing video downloads.
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "chrome" });
const rows = [];
let failed = false;
for (const [path, budget] of Object.entries(config.pages)) {
  const loadBudget = budget.loadKB ?? config.defaults.loadKB;
  const idleBudget = budget.idleKB ?? config.defaults.idleKB;
  const r = await measure(browser, path);
  const problems = [];
  if (r.load > loadBudget * 1024) problems.push(`load ${kb(r.load)} > ${loadBudget} KB budget`);
  if (r.idle > idleBudget * 1024)
    problems.push(`idle ${kb(r.idle)} in ${IDLE_SECONDS}s > ${idleBudget} KB budget`);
  problems.push(...r.repeats);
  if (problems.length) failed = true;
  rows.push({ path, ...r, loadBudget, idleBudget, problems });
  console.log(
    `${problems.length ? "FAIL" : "ok  "} ${path}  load ${kb(r.load)}  idle ${kb(r.idle)}`,
  );
  for (const p of problems) console.log(`       - ${p}`);
}
await browser.close();

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "### Docs bandwidth budget",
    "",
    "| Page | Load | Idle | Result |",
    "| --- | --- | --- | --- |",
    ...rows.map(
      (r) =>
        `| \`${r.path}\` | ${kb(r.load)} / ${r.loadBudget} KB | ${kb(r.idle)} / ${r.idleBudget} KB | ${
          r.problems.length ? "❌ " + r.problems.join("<br>") : "✅"
        } |`,
    ),
    "",
    "Every byte here is paid for on each visit. Prefer MP4 over GIF, never add cache-busting query strings to static files, and keep animations from re-downloading while a page is open.",
  ];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
}

process.exit(failed ? 1 : 0);
