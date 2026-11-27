// Shared by check-urls.mjs and update-urls.mjs. docs/urls.txt lists every URL that must keep
// working: each page the site serves, and each old URL that now redirects. Lines are only ever added.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const docsDir = fileURLToPath(new URL("..", import.meta.url));
export const urlsFile = `${docsDir}urls.txt`;

export const readLines = (text) => [...new Set(text.split("\n").filter(Boolean))];

/** The URLs in urls.txt. */
export const readListedUrls = () =>
  existsSync(urlsFile) ? readLines(readFileSync(urlsFile, "utf8")) : [];

/** Reads a manifest from the last `next build`. */
export const readBuildManifest = (file) =>
  JSON.parse(readFileSync(`${docsDir}.next/${file}`, "utf8"));

/**
 * Every page in the last `next build`: static pages plus every page a dynamic route prerendered
 * from generateStaticParams. OG images, Markdown mirrors, API routes and Next.js internals are not
 * pages people link to.
 */
export function readBuiltPages() {
  const routes = readBuildManifest("routes-manifest.json");
  const prerender = readBuildManifest("prerender-manifest.json");
  return new Set(
    [...routes.staticRoutes.map((route) => route.page), ...Object.keys(prerender.routes)].filter(
      (url) => !/^\/(og|llms\.mdx|api|_not-found|_global-error)(\/|$)/.test(url),
    ),
  );
}
