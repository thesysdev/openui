// Tells IndexNow search engines (Bing, Yandex, ...) which sitemap URLs were added, changed or
// removed. It hashes the text of every page in the live sitemap and compares the hashes with the
// previous run's, so unchanged pages are never resubmitted. With no previous hashes, every URL
// counts as new.
//
// Usage: INDEXNOW_KEY=... node scripts/submit-indexnow.mjs <previous-hashes.json> <new-hashes.json> [--dry-run]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const HOST = "www.openui.com";
const [previousFile, outputFile] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const dryRun = process.argv.includes("--dry-run");
const key = process.env.INDEXNOW_KEY;

if (!previousFile || !outputFile)
  throw new Error("Usage: submit-indexnow.mjs <previous.json> <output.json>");
if (!key && !dryRun) throw new Error("INDEXNOW_KEY is not set");

async function get(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return { body: await response.text(), type: response.headers.get("content-type") ?? "" };
}

// What a reader sees: the title, description and visible text. Scripts carry build IDs that change
// on every deploy, so they are left out.
function pageText({ body, type }) {
  if (!type.includes("text/html")) return body;
  const description = body.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  const text = body
    .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${description}\n${text}`;
}

const sitemap = await get(`https://${HOST}/sitemap.xml`);
const urls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const hashes = {};
const queue = [...urls];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      hashes[url] = createHash("sha256")
        .update(pageText(await get(url)))
        .digest("hex");
    }
  }),
);

const previous = existsSync(previousFile) ? JSON.parse(readFileSync(previousFile, "utf8")) : {};
const changed = urls.filter((url) => previous[url] !== hashes[url]);
const removed = Object.keys(previous).filter((url) => !(url in hashes));
const urlList = [...changed, ...removed];

console.log(
  `${urls.length} URLs in the sitemap: ${changed.length} new or changed, ${removed.length} removed`,
);
for (const url of urlList) console.log(`  ${url}`);

if (urlList.length > 0 && !dryRun) {
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
  });
  console.log(`IndexNow responded ${response.status}`);
  if (!response.ok) throw new Error(await response.text());
}

writeFileSync(outputFile, `${JSON.stringify(hashes, null, 2)}\n`);
