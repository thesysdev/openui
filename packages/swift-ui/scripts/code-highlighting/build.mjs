import { build } from "esbuild";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const resources = resolve(here, "../../Sources/OpenUISwiftUI/Resources");
const packageInfo = JSON.parse(readFileSync(resolve(here, "node_modules/refractor/package.json")));
if (packageInfo.version !== "5.0.0") throw new Error("Review upstream syntax-highlighter version");
const result = await build({
  absWorkingDir: here,
  entryPoints: ["entry.js"],
  bundle: true,
  write: false,
  format: "iife",
  globalName: "NativeCodeSyntax",
  platform: "neutral",
  target: ["safari15"],
  minify: true,
  legalComments: "eof",
  metafile: true,
});
const content = result.outputFiles[0].contents;
writeFileSync(resolve(resources, "code-highlighting.js"), content);
const notices = [];
const dependencies = new Set();
for (const path of Object.keys(result.metafile.inputs)) {
  const parts = path.split("node_modules/");
  if (parts.length < 2) continue;
  const name = parts.at(-1).startsWith("@")
    ? parts.at(-1).split("/").slice(0, 2).join("/") : parts.at(-1).split("/")[0];
  dependencies.add(name);
}
for (const name of [...dependencies].sort()) {
  const root = resolve(here, "node_modules", name);
  const info = JSON.parse(readFileSync(resolve(root, "package.json")));
  const license = ["license", "LICENSE", "LICENSE.md"].map((file) => {
    try { return readFileSync(resolve(root, file), "utf8"); } catch { return null; }
  }).find(Boolean);
  if (!license) throw new Error("Missing license for " + name);
  notices.push(`${name} ${info.version}\n${license}`);
}
writeFileSync(resolve(resources, "CodeHighlighting-LICENSES.txt"), notices.join("\n\n"));
writeFileSync(resolve(resources, "code-highlighting-manifest.json"), JSON.stringify({
  upstream: "https://github.com/thesysdev/openui/blob/main/packages/react-ui/src/components/CodeBlock/CodeBlock.tsx",
  renderer: "react-syntax-highlighter@16.1.1 (Prism / refractor)",
  refractor: packageInfo.version,
  sha256: createHash("sha256").update(content).digest("hex"),
  bytes: content.length,
  dependencies: [...dependencies].sort(),
}, null, 2) + "\n");
console.log(`Native code highlighting: ${content.length} bytes; ${dependencies.size} licensed dependencies`);
