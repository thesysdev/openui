import * as fs from "node:fs";
import * as path from "node:path";

import { fetchSourceFile } from "../checkout";
import type { RetryAttemptInfo } from "../retry";

const SKILL_REPO = { owner: "thesysdev", name: "skills" };
const SKILL_PATH = "skills/openui/SKILL.md";
const SKILL_URL = `https://raw.githubusercontent.com/thesysdev/skills/refs/heads/main/${SKILL_PATH}`;

/** The coding-agent paragraph template READMEs ship; also the offline AGENTS.md body. */
const SKILL_POINTER = `This project is built with [OpenUI](https://www.openui.com). Before changing it, read the maintained OpenUI skill for coding agents published at [thesysdev/skills](${SKILL_URL}).`;
const AGENTS_POINTER =
  "This project is built with [OpenUI](https://www.openui.com). Before changing it, read [AGENTS.md](AGENTS.md), the OpenUI guide for coding agents.";

const FALLBACK_GUIDE = `# OpenUI: guide for coding agents\n\n${SKILL_POINTER}\n`;

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/;
const INLINE_LINK = /(\]\()([^)\s]+)/g;
const REFERENCE_LINK = /^(\s*\[[^\]]+\]:\s*)(\S+)/gm;
const FENCE = /^(```|~~~)/;

function absolutize(href: string, base: string): string {
  // Leave in-page anchors and links that already carry a scheme.
  if (href.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(href)) return href;
  return new URL(href, base).href;
}

/** Skill markdown → AGENTS.md: drop the frontmatter and point relative links at GitHub. */
export function skillToAgentsGuide(skill: string, skillUrl = SKILL_URL): string {
  let inFence = false;
  return skill
    .replace(FRONTMATTER, "")
    .split("\n")
    .map((line) => {
      if (FENCE.test(line.trimStart())) inFence = !inFence;
      if (inFence) return line;
      return line
        .replace(INLINE_LINK, (_, open: string, href: string) => open + absolutize(href, skillUrl))
        .replace(
          REFERENCE_LINK,
          (_, label: string, href: string) => label + absolutize(href, skillUrl),
        );
    })
    .join("\n");
}

const BLOCK_START = "<!-- openui:start -->";
const BLOCK_END = "<!-- openui:end -->";
const BLOCK = new RegExp(`${BLOCK_START}[\\s\\S]*?${BLOCK_END}`);

export type AgentsGuideResult = "created" | "appended" | "updated";

/** Fetches the OpenUI skill as AGENTS.md content. */
export async function fetchAgentsGuide(
  opts: { onRetry?: (info: RetryAttemptInfo) => void } = {},
): Promise<string> {
  const { content } = await fetchSourceFile(SKILL_PATH, {
    repo: SKILL_REPO,
    onRetry: opts.onRetry,
  });
  return skillToAgentsGuide(content);
}

/** Adds the guide to AGENTS.md inside OpenUI markers: replaces an earlier block, else appends or creates. */
export function upsertAgentsGuide(projectDir: string, guide: string): AgentsGuideResult {
  const file = path.join(projectDir, "AGENTS.md");
  const block = `${BLOCK_START}\n${guide.trim()}\n${BLOCK_END}\n`;
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, block);
    return "created";
  }
  const existing = fs.readFileSync(file, "utf8");
  if (BLOCK.test(existing)) {
    fs.writeFileSync(
      file,
      existing.replace(BLOCK, () => block.trimEnd()),
    );
    return "updated";
  }
  fs.writeFileSync(file, `${existing.trimEnd()}\n\n${block}`);
  return "appended";
}

/** Scaffold step: writes AGENTS.md, falling back to a pointer to the skill when offline. */
export async function writeAgentsGuide(
  projectDir: string,
  opts: { onRetry?: (info: RetryAttemptInfo) => void } = {},
): Promise<void> {
  let guide = FALLBACK_GUIDE;
  try {
    guide = await fetchAgentsGuide(opts);
  } catch {
    // A missing guide shouldn't fail the scaffold; the pointer still leads to the skill.
  }
  upsertAgentsGuide(projectDir, guide);
  pointReadmeToAgentsGuide(projectDir);
}

// Templates keep the skill link in their README so older CLIs, which don't write
// AGENTS.md, still scaffold a working pointer; swap it once AGENTS.md exists.
function pointReadmeToAgentsGuide(projectDir: string) {
  const readme = path.join(projectDir, "README.md");
  if (!fs.existsSync(readme)) return;
  const content = fs.readFileSync(readme, "utf8");
  if (content.includes(SKILL_POINTER)) {
    fs.writeFileSync(readme, content.replace(SKILL_POINTER, AGENTS_POINTER));
  }
}
