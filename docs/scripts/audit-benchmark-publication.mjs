const baseUrl = (process.env.BENCHMARK_BASE_URL ?? "http://localhost:3067").replace(/\/$/, "");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const crawlerAgents = [
  ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
  ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
  ["OAI-SearchBot", "OAI-SearchBot/1.0; +https://openai.com/searchbot"],
];

const challengeMarkers = [
  "cf-chl-",
  "Just a moment...",
  "Enable JavaScript and cookies to continue",
  "Attention Required! | Cloudflare",
];

const fetchPath = async (path, userAgent) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: userAgent ? { "User-Agent": userAgent } : undefined,
    redirect: "follow",
  });
  const text = await response.text();
  assert(response.ok, `${path} returned ${response.status}`);
  assert(
    !challengeMarkers.some((marker) => text.includes(marker)),
    `${path} returned an interstitial or bot challenge`,
  );
  return { response, text };
};

const { text: robots } = await fetchPath("/robots.txt");
assert(robots.toLowerCase().includes("allow: /"), "robots.txt does not explicitly allow crawling");
assert(!/disallow:\s*\/benchmarks(?:\s|$)/i.test(robots), "robots.txt disallows /benchmarks");

for (const [name, userAgent] of crawlerAgents) {
  const { text: html } = await fetchPath("/benchmarks", userAgent);
  assert(html.includes("Generative UI"), `${name} cannot see the benchmark heading`);
  assert(html.includes('"@type":"Dataset"'), `${name} cannot see Dataset JSON-LD`);
  assert(html.includes('rel="canonical"'), `${name} cannot see the canonical link`);
  assert(html.includes("View chart data"), `${name} cannot see server-rendered chart data`);
  assert(
    html.includes("Model comparison data") && html.includes("Format comparison data"),
    `${name} cannot see both tab datasets`,
  );

  const { text: languageHtml } = await fetchPath("/benchmarks/language", userAgent);
  assert(
    languageHtml.includes("OpenUI language and model benchmark"),
    `${name} cannot see the language benchmark`,
  );
  assert(languageHtml.includes('"@type":"Dataset"'), `${name} cannot see language Dataset JSON-LD`);

  const { text: frameworkHtml } = await fetchPath("/benchmarks/framework", userAgent);
  assert(
    frameworkHtml.includes("Generative UI framework benchmark"),
    `${name} cannot see the framework benchmark`,
  );
  assert(
    frameworkHtml.includes('"@type":"Dataset"'),
    `${name} cannot see framework Dataset JSON-LD`,
  );
}

const endpointChecks = [
  ["/benchmarks/data.json", "application/json"],
  ["/benchmarks/data.schema.json", "application/schema+json"],
  ["/benchmarks/data.csv", "text/csv"],
  ["/benchmarks/agent.md", "text/markdown"],
  ["/benchmarks/methodology", "text/html"],
  ["/benchmarks/language", "text/html"],
  ["/benchmarks/language/data.json", "application/json"],
  ["/benchmarks/language/data.csv", "text/csv"],
  ["/benchmarks/language/agent.md", "text/markdown"],
  ["/benchmarks/framework", "text/html"],
  ["/benchmarks/framework/data.json", "application/json"],
  ["/benchmarks/framework/data.csv", "text/csv"],
  ["/benchmarks/framework/agent.md", "text/markdown"],
  ["/llms.txt", "text/plain"],
  ["/sitemap.xml", "application/xml"],
];

for (const [path, contentType] of endpointChecks) {
  const { response } = await fetchPath(path, crawlerAgents[2][1]);
  assert(
    response.headers.get("content-type")?.includes(contentType),
    `${path} has unexpected content type: ${response.headers.get("content-type")}`,
  );
}

console.log(`Benchmark publication audit passed for ${baseUrl}.`);
