#!/usr/bin/env node
// Fails when a URL in docs/urls.txt stops working: a page removed without a redirect, a redirect
// removed, or a line deleted from the file. Also fails when a page isn't listed yet. Run it after
// `next build`; pages and redirects come from the build's manifests.
//
//   pnpm build && pnpm check:urls [--base <ref>]   # base defaults to origin/main

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { docsDir, readBuildManifest, readBuiltPages, readLines, readListedUrls } from "./urls.mjs";

const require = createRequire(import.meta.url);
const { getPathMatch } = require("next/dist/shared/lib/router/utils/path-match");
const { compile } = require("next/dist/compiled/path-to-regexp");

const args = process.argv.slice(2);
const baseRef = args.includes("--base") ? args[args.indexOf("--base") + 1] : "origin/main";

const pages = readBuiltPages();
const listed = readListedUrls();
const routes = readBuildManifest("routes-manifest.json");

const redirects = routes.redirects
  .filter((redirect) => !redirect.internal && !redirect.has && !redirect.missing)
  .map((redirect) => ({
    ...redirect,
    // The options Next.js uses for redirects (server/lib/router-utils/filesystem.js).
    match: getPathMatch(redirect.source, { strict: true, removeUnnamedParams: true }),
  }));

/** Follows redirects from `url`; returns every hop and what's wrong with where it ends, if anything. */
function followRedirects(url) {
  const chain = [url];
  for (;;) {
    const current = chain.at(-1);
    const redirect = redirects.find((r) => r.match(current));
    if (!redirect) {
      if (chain.length === 1) return { chain, problem: "not a page, and no redirect" };
      return { chain, problem: pages.has(current) ? null : "destination does not exist" };
    }
    if (/^https?:\/\//.test(redirect.destination)) {
      return { chain: [...chain, redirect.destination], problem: null };
    }
    const destination = compile(redirect.destination, { validate: false })(redirect.match(current));
    const [path] = destination.split(/[?#]/);
    if (chain.includes(path)) return { chain: [...chain, path], problem: "redirect loop" };
    chain.push(path);
  }
}

const git = (...gitArgs) =>
  execFileSync("git", gitArgs, {
    cwd: docsDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
const base = git("merge-base", baseRef, "HEAD").trim();
let baseListed = [];
try {
  baseListed = readLines(git("show", `${base}:./urls.txt`));
} catch {
  // urls.txt doesn't exist on the base branch yet.
}

const errors = [];

const deleted = baseListed.filter((url) => !listed.includes(url));
if (deleted.length > 0) {
  errors.push(
    `These URLs were deleted from urls.txt. Keep them, and redirect any that are no longer pages:\n` +
      deleted.map((url) => `  ${url}`).join("\n"),
  );
}

const missing = [...pages].filter((url) => !listed.includes(url)).sort();
if (missing.length > 0) {
  errors.push(
    "These pages aren't in urls.txt. Run `pnpm build && pnpm urls:update` and commit it:\n" +
      missing.map((url) => `  ${url}`).join("\n"),
  );
}

const broken = [...new Set([...baseListed, ...listed])]
  .filter((url) => !pages.has(url))
  .map(followRedirects)
  .filter(({ problem }) => problem);
if (broken.length > 0) {
  errors.push(
    "These URLs no longer work. Add a redirect in docs/next.config.mjs to the page that replaced each one:\n" +
      broken.map(({ chain, problem }) => `  ${chain.join(" → ")}  (${problem})`).join("\n"),
  );
}

if (errors.length > 0) {
  console.error(errors.join("\n\n"));
  process.exit(1);
}
const redirected = listed.length - listed.filter((url) => pages.has(url)).length;
console.log(
  `All ${listed.length} URLs in urls.txt work: ${pages.size} pages, ${redirected} redirected.`,
);
