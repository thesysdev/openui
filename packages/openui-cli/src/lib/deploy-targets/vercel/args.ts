import type { CliInvocation } from "../../cli-bin";

const ENV_FLAGS = ["--env", "-e"] as const;
const BUILD_ENV_FLAGS = ["--build-env", "-b"] as const;
const ALL_ENV_FLAGS = [...ENV_FLAGS, ...BUILD_ENV_FLAGS] as const;

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

export function publicVercelArgs(args: string[]): string[] {
  return args.filter((_, index) => !isVercelEnvFlag(args, index));
}

export function isVercelEnvFlag(args: string[], index: number): boolean {
  const arg = args[index]!;
  if ((ALL_ENV_FLAGS as readonly string[]).includes(arg)) return true;
  if (/^(?:--env|-e|--build-env|-b)=/.test(arg)) return true;
  const prev = args[index - 1];
  return prev !== undefined && (ALL_ENV_FLAGS as readonly string[]).includes(prev);
}

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

export function vercelSpawnArgs(invocation: CliInvocation, args: string[]): string[] {
  return [...invocation.quietPrefixArgs, ...args];
}
