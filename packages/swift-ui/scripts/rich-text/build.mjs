import { build } from "esbuild";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "../../../..");
const resources = resolve(here, "../../Sources/OpenUISwiftUI/Resources");
const revision = "9d73d17d2bbac565672a85e78f6eb7740cb0d9ca";
const upstream = {
  citations: "packages/react-ui/src/components/_shared/remark/remarkCitations.ts",
  "safe-url": "packages/react-ui/src/components/_shared/utils/safeUrl.ts",
};
const result = await build({
  absWorkingDir: here, entryPoints: ["entry.js"], bundle: true, write: false,
  format: "iife", globalName: "NativeRichText", platform: "neutral",
  target: ["safari15"], minify: true, legalComments: "eof", metafile: true,
  plugins: [{ name: "upstream-text", setup(builder) {
    builder.onResolve({ filter: /^upstream:/ }, ({ path }) => ({ path: path.slice(9), namespace: "upstream" }));
    builder.onLoad({ filter: /.*/, namespace: "upstream" }, ({ path }) => ({
      contents: execFileSync("git", ["show", `${revision}:${upstream[path]}`], { cwd: repository, encoding: "utf8" }),
      loader: "ts", resolveDir: here,
    }));
  } }],
});
const script = result.outputFiles[0].contents;
const katex = resolve(here, "node_modules/katex");
let embeddedFontCount = 0;
const css = readFileSync(resolve(katex, "dist/katex.min.css"), "utf8").replace(/src:[^;}]+/g, (source) => {
  const match = source.match(/url\(([^)]+\.woff2)\)/);
  if (!match) return source;
  const font = readFileSync(resolve(katex, "dist", match[1]));
  embeddedFontCount++;
  return `src:url(data:font/woff2;base64,${font.toString("base64")}) format("woff2")`;
});
if (!embeddedFontCount || /url\((?!data:)/.test(css)) {
  throw new Error("Math CSS must contain embedded fonts only");
}
const dependencies = new Set(["katex"]);
for (const path of Object.keys(result.metafile.inputs)) {
  const entry = path.split("node_modules/").at(-1);
  if (!path.includes("node_modules/")) continue;
  dependencies.add(entry.startsWith("@") ? entry.split("/").slice(0, 2).join("/") : entry.split("/")[0]);
}
const notices = [];
const versions = {};
const supplementalLicenses = JSON.parse(readFileSync(resolve(here, "licenses/manifest.json"), "utf8"));
const licenseSources = {};
for (const name of [...dependencies].sort()) {
  const root = resolve(here, "node_modules", name);
  versions[name] = JSON.parse(readFileSync(resolve(root, "package.json"))).version;
  let license = ["license", "LICENSE", "LICENSE.md", "LICENSE.txt"].map((file) => {
    try { return readFileSync(resolve(root, file), "utf8"); } catch { return null; }
  }).find(Boolean);
  if (!license) {
    const source = supplementalLicenses[name];
    if (source?.version === versions[name]) {
      license = readFileSync(resolve(here, "licenses", source.file), "utf8");
      licenseSources[name] = source;
    }
  }
  if (!license) throw new Error("Missing license for " + name);
  notices.push(`${name} ${versions[name]}\n${license}`);
}
notices.push("Upstream OpenUI source license\n" + execFileSync("git", ["show", `${revision}:LICENSE`], { cwd: repository, encoding: "utf8" }));
// Validate every dependency notice before replacing any bundled resources.
writeFileSync(resolve(resources, "rich-text.js"), script);
writeFileSync(resolve(resources, "rich-math.css"), css);
writeFileSync(resolve(resources, "RichText-LICENSES.txt"), notices.join("\n\n"));
writeFileSync(resolve(resources, "rich-text-manifest.json"), JSON.stringify({
  upstream: revision, upstreamFiles: upstream, versions, licenseSources,
  scriptSHA256: createHash("sha256").update(script).digest("hex"),
  cssSHA256: createHash("sha256").update(css).digest("hex"),
  offlineFonts: true, embeddedFontCount,
}, null, 2) + "\n");
console.log(`Native rich text: ${script.length} script bytes; ${css.length} CSS/font bytes`);
