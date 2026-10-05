// Launch wrapper that fixes the agent's workspace BEFORE starting Next.
//
// The coding agent's read/bash/edit/write tools operate on PI_AGENT_CWD. Rather
// than silently defaulting to this app's own folder, we resolve the workspace
// explicitly (from a CLI arg, the PI_AGENT_CWD env var, or an interactive
// prompt), then start Next with it set.
//
//   pnpm dev -- /path/to/project   # explicit
//   pnpm dev                       # prompts (falls back to cwd if non-interactive)
//   PI_AGENT_CWD=/path pnpm dev    # env (no prompt)
import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const NEXT_ARGS = {
  dev: ["dev", "--webpack"],
  start: ["start"],
};

const mode = process.argv[2];
if (!NEXT_ARGS[mode]) {
  console.error(`launch.mjs: unknown mode "${mode}" (expected: dev | start)`);
  process.exit(1);
}

async function chooseWorkspace() {
  const fromArg = process.argv[3];
  if (fromArg) {
    if (fromArg.startsWith("-")) {
      console.error(`launch.mjs: "${fromArg}" looks like a flag, not a path.`);
      console.error(
        'Pass the workspace after a space-separated "--", e.g.:  pnpm dev -- /absolute/path',
      );
      process.exit(1);
    }
    return fromArg;
  }
  if (process.env.PI_AGENT_CWD) return process.env.PI_AGENT_CWD;
  if (stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = (
      await rl.question(`\nWorkspace the agent may read/run/edit in [${process.cwd()}]: `)
    ).trim();
    rl.close();
    return answer || process.cwd();
  }
  return process.cwd(); // non-interactive (CI, piped): don't hang
}

const workspace = resolve(await chooseWorkspace());
if (!existsSync(workspace) || !statSync(workspace).isDirectory()) {
  console.error(`launch.mjs: not a directory: ${workspace}`);
  console.error("Pass an existing directory, e.g.:  pnpm dev -- /absolute/path");
  process.exit(1);
}

console.log(`\n  🛠  Pi agent workspace: ${workspace}`);
console.log(
  "     read / bash / edit / write act here, and bash can escape it (see README → Security)\n",
);

const child = spawn("next", NEXT_ARGS[mode], {
  stdio: "inherit",
  env: { ...process.env, PI_AGENT_CWD: workspace },
});
child.on("error", (err) => {
  console.error(`launch.mjs: failed to start next: ${err.message}`);
  process.exit(1);
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
