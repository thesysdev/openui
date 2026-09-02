import type { CliInvocation } from "../../cli-bin";
import { SENSITIVE_DEPLOY_ENV_KEYS } from "../../deploy/project-env";
import { confirmOrDefault } from "../../deploy/prompt";
import { mutedNpmEnv, runCommand } from "../../process-runner";
import { vercelSpawnArgs } from "./args";
import { isVercelLinked } from "./auth";

/** Environments we keep in sync for template deploys. */
const PROJECT_ENV_TARGETS = ["production", "preview", "development"] as const;

type VercelEnvEntry = {
  key: string;
  target?: string[];
};

/**
 * Upserts allowlisted local env onto the linked Vercel project for any
 * missing targets. Never overwrites existing targets — secret values aren't
 * readable for a safe compare. Returns how many distinct keys were written.
 */
export async function syncLocalEnvToVercelProject(opts: {
  invocation: CliInvocation;
  projectDir: string;
  localEnv: Record<string, string>;
  yes: boolean;
  noInteractive: boolean;
}): Promise<number> {
  if (!isVercelLinked(opts.projectDir)) {
    console.info(
      "Vercel project not linked yet — env is attached to this deployment only. After the first deploy, missing keys can be saved to the project.\n",
    );
    return 0;
  }

  const existing = await listVercelProjectEnv(opts.invocation, opts.projectDir);
  if (!existing) {
    console.info("Could not read Vercel project env — continuing with deployment-only env.\n");
    return 0;
  }

  const pending: { key: string; targets: string[]; value: string }[] = [];
  for (const key of Object.keys(opts.localEnv).sort()) {
    const value = opts.localEnv[key];
    if (value === undefined) continue;
    const targets = missingTargetsForKey(existing, key);
    if (targets.length === 0) continue;
    pending.push({ key, targets, value });
  }

  if (pending.length === 0) {
    console.info(
      `Vercel project already has ${Object.keys(opts.localEnv).sort().join(", ")} — leaving project env unchanged.\n`,
    );
    return 0;
  }

  const keyList = pending.map((item) => item.key).join(", ");
  const shouldSave = await confirmOrDefault(
    `Save ${keyList} to this Vercel project where missing (production / preview / development)?`,
    {
      yes: opts.yes,
      noInteractive: opts.noInteractive,
      cancelStage: "vercel_env_prompt",
    },
  );
  if (!shouldSave) {
    console.info("Skipping project env save — using deployment-only env for this run.\n");
    return 0;
  }

  const savedKeyNames: string[] = [];
  for (const item of pending) {
    const ok = await addVercelProjectEnv({
      invocation: opts.invocation,
      projectDir: opts.projectDir,
      key: item.key,
      value: item.value,
      targets: item.targets,
    });
    if (ok) {
      savedKeyNames.push(item.key);
      existing.push({ key: item.key, target: [...item.targets] });
    }
  }

  if (savedKeyNames.length > 0) {
    console.info(`Saved ${savedKeyNames.join(", ")} to the Vercel project.\n`);
  }
  return savedKeyNames.length;
}

async function listVercelProjectEnv(
  invocation: CliInvocation,
  projectDir: string,
): Promise<VercelEnvEntry[] | null> {
  const result = await runCommand(
    invocation.command,
    vercelSpawnArgs(invocation, ["env", "list", "--json", "--non-interactive"]),
    projectDir,
    { echo: false, stdin: "ignore" },
  );
  if (result.error || result.status !== 0) return null;
  const parsed = extractJsonObject(result.diagnosticTail) as { envs?: VercelEnvEntry[] } | null;
  if (!parsed || !Array.isArray(parsed.envs)) return null;
  return parsed.envs;
}

/** First JSON object in mixed CLI stdout/stderr. */
function extractJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function missingTargetsForKey(entries: VercelEnvEntry[], key: string): string[] {
  const present = new Set<string>();
  for (const entry of entries) {
    if (entry.key !== key) continue;
    for (const target of entry.target ?? []) present.add(target);
  }
  return PROJECT_ENV_TARGETS.filter((target) => !present.has(target));
}

async function addVercelProjectEnv(opts: {
  invocation: CliInvocation;
  projectDir: string;
  key: string;
  value: string;
  targets: string[];
}): Promise<boolean> {
  const args = [
    "env",
    "add",
    opts.key,
    opts.targets.join(","),
    "--value",
    opts.value,
    "--yes",
    "--non-interactive",
  ];
  if (SENSITIVE_DEPLOY_ENV_KEYS.has(opts.key)) args.push("--sensitive");

  const result = await runCommand(
    opts.invocation.command,
    vercelSpawnArgs(opts.invocation, args),
    opts.projectDir,
    { echo: false, stdin: "ignore", env: mutedNpmEnv() },
  );
  if (!result.error && result.status === 0) return true;

  console.info(
    `[!] Could not save ${opts.key} to the Vercel project — it will still be passed on this deployment.`,
  );
  if (result.diagnosticTail.trim()) {
    const hint = result.diagnosticTail.trim().split(/\r?\n/).slice(-3).join("\n");
    console.info(hint);
  }
  console.info("");
  return false;
}
