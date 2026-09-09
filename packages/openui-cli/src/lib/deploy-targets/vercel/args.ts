import type { CliInvocation } from "../../cli-bin";

const ENV_FLAGS = ["--env", "-e"] as const;
const BUILD_ENV_FLAGS = ["--build-env", "-b"] as const;
const ALL_ENV_FLAGS = [...ENV_FLAGS, ...BUILD_ENV_FLAGS] as const;

/** Build `vercel` args: `--yes`, forwarded extras, and allowlisted `--env`/`--build-env`. */
export function buildVercelDeployArgs(opts: {
  extraArgs: string[];
  yes: boolean;
  localEnv: Record<string, string>;
}): string[] {
  const args = [...opts.extraArgs];
  if (opts.yes && !args.includes("--yes") && !args.includes("-y")) args.unshift("--yes");

  const envKeys = envKeysInArgs(args, ENV_FLAGS);
  const buildEnvKeys = envKeysInArgs(args, BUILD_ENV_FLAGS);
  for (const key of Object.keys(opts.localEnv).sort()) {
    const value = opts.localEnv[key];
    if (value === undefined) continue;
    const assignment = `${key}=${value}`;
    // Next.js inlines process.env at `next build`. Runtime `--env` alone is
    // not enough — the remote build also needs `--build-env`.
    if (!envKeys.has(key)) args.push("--env", assignment);
    if (!buildEnvKeys.has(key)) args.push("--build-env", assignment);
  }
  return args;
}

/** Strip env assignments so verbose logs never print secret values. */
export function publicVercelArgs(args: string[]): string[] {
  return args.filter((_, index) => !isVercelEnvFlag(args, index));
}

/** True if this argv slot is an `--env` / `--build-env` flag or its value. */
export function isVercelEnvFlag(args: string[], index: number): boolean {
  const arg = args[index]!;
  if ((ALL_ENV_FLAGS as readonly string[]).includes(arg)) return true;
  if (/^(?:--env|-e|--build-env|-b)=/.test(arg)) return true;
  const prev = args[index - 1];
  return prev !== undefined && (ALL_ENV_FLAGS as readonly string[]).includes(prev);
}

/** Collect env keys already present on the given flags so we do not duplicate them. */
function envKeysInArgs(args: string[], flags: readonly string[]): Set<string> {
  const keys = new Set<string>();
  const flagSet = new Set(flags);
  const prefixed = new RegExp(
    `^(?:${flags.map((flag) => flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})=(.+)$`,
  );
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (flagSet.has(arg)) {
      const assignment = args[i + 1];
      const key = assignment?.split("=")[0];
      if (key) keys.add(key);
      i += 1;
      continue;
    }
    const match = arg.match(prefixed);
    if (match?.[1]) keys.add(match[1].split("=")[0]!);
  }
  return keys;
}

/** Prefix Vercel args with the quiet package-manager invocation (dlx/npx). */
export function vercelSpawnArgs(invocation: CliInvocation, args: string[]): string[] {
  return [...invocation.quietPrefixArgs, ...args];
}
