#!/usr/bin/env node
// Adds the pages from the last `next build` to docs/urls.txt. Never removes a line: an old URL
// stays listed so check-urls.mjs keeps checking that it redirects.
//
//   pnpm build && pnpm urls:update

import { writeFileSync } from "node:fs";
import { readBuiltPages, readListedUrls, urlsFile } from "./urls.mjs";

const listed = readListedUrls();
const all = [...new Set([...listed, ...readBuiltPages()])].sort();
writeFileSync(urlsFile, `${all.join("\n")}\n`);
console.log(`urls.txt: ${all.length} URLs, ${all.length - listed.length} added.`);
