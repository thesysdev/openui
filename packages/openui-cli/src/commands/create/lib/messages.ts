import * as fs from "node:fs";
import * as path from "node:path";

import { THESYS_KEYS_URL } from "../../../lib/auth/mint";
import { DEFAULT_ENV_FILE } from "../../../lib/env";

/** `cd` into the project, or nothing when it was created in the current folder. */
export function cdStep(dir: string): string[] {
  return dir === "." ? [] : [`> cd ${dir}`];
}

export function missingCloudKeyNote(
  projectDir: string,
  dlxCmd: string,
  envFile = DEFAULT_ENV_FILE,
): string {
  const fileArg = envFile === DEFAULT_ENV_FILE ? "" : ` --file ${envFile}`;
  return [
    `[!] No OpenUI Cloud API key added. Sign in and write one to ${envFile} with:`,
    ...cdStep(projectDir),
    `> ${dlxCmd} @openuidev/cli@latest generate-api-key${fileArg}`,
    `(or create one at ${THESYS_KEYS_URL} and set THESYS_API_KEY yourself)`,
  ].join("\n");
}

/** The scaffolded project's README, if it has one. */
export function readmePath(projectDir: string): string | undefined {
  const file = path.join(projectDir, "README.md");
  return fs.existsSync(file) ? file : undefined;
}

/** Last line for a coding agent: where to read next, as a path it can open. */
export function agentReadmeNote(readmePath: string): string {
  return `Coding agent: read the project README to get started:\n> ${readmePath}`;
}

/** With `--no-skill` there's no AGENTS.md, so point at the skill directly. */
export function skillInstallHint(): string {
  return "Using a coding agent? Install the OpenUI skill:\n> npx skills add thesysdev/skills";
}

export function getStartedMessage(o: {
  name: string;
  /** What to `cd` into: the project folder, or `.` when created in place. */
  dir: string;
  devCmd: string;
  dlxCmd: string;
  backendGettingStarted?: string;
  envWritten: boolean;
  /** A key is in `.env` or already exported in the shell. */
  apiKeyAvailable: boolean;
  startDev: boolean;
  installCmd: string;
  dependencyInstalled: boolean;
  /** Set for agent runs: the scaffolded README to point the agent at. */
  agentReadmePath?: string;
  /** `--no-skill` runs: suggest installing the OpenUI skill instead of AGENTS.md. */
  skillHint?: boolean;
}): string {
  const envNote = o.envWritten ? "✅ .env created with your OpenUI Cloud API key + base URL." : "";

  // Without a key the app can't answer yet, so the key step replaces the usual run steps.
  const nextStep = !o.apiKeyAvailable
    ? [
        "Next, add your OpenUI API key. This signs you in and writes THESYS_API_KEY to .env:",
        "",
        ...cdStep(o.dir),
        ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
        `> ${o.dlxCmd} @openuidev/cli@latest generate-api-key`,
        `> ${o.devCmd} run dev`,
      ].join("\n")
    : o.startDev
      ? `Starting the development server in "${o.name}"...\n\n> ${o.devCmd} run dev`
      : [
          ...cdStep(o.dir),
          ...(o.dependencyInstalled ? [] : [`> ${o.installCmd}`]),
          `> ${o.devCmd} run dev`,
        ].join("\n");

  const deployHint = `Share a preview:\n> ${o.dlxCmd} @openuidev/cli@latest deploy`;
  const feedbackHint = `Found a bug or have an idea?\n> ${o.dlxCmd} @openuidev/cli@latest feedback "<message>"`;

  const frameworkNote = o.backendGettingStarted?.replaceAll("{{packageManager}}", o.devCmd) ?? "";

  return `\n${[
    "Done!",
    envNote,
    frameworkNote,
    nextStep,
    o.skillHint ? skillInstallHint() : "",
    deployHint,
    feedbackHint,
    o.agentReadmePath ? agentReadmeNote(o.agentReadmePath) : "",
  ]
    .filter(Boolean)
    .join("\n\n")}\n`;
}
