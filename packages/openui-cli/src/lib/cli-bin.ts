import * as fs from "node:fs";
import * as path from "node:path";

import {
  resolveDlxInvocation,
  resolveInstallPackageManager,
  type PackageManager,
} from "./detect-package-manager";

/** How a third-party CLI binary was resolved for spawn. */
export type CliInvocation = {
  command: string;
  prefixArgs: string[];
  /** Prefer for non-interactive spawns — suppresses package-manager noise. */
  quietPrefixArgs: string[];
  source: "local" | "path" | "dlx";
};

/**
 * Resolve `bin` from local node_modules, PATH, or the active package manager's dlx.
 * Shared by deploy targets (Vercel today; other platform CLIs later).
 */
export function resolveCliInvocation(
  projectDir: string,
  bin: string,
  packageManager: PackageManager = resolveInstallPackageManager(),
): CliInvocation {
  const localUnix = path.join(projectDir, "node_modules", ".bin", bin);
  const localWin = `${localUnix}.cmd`;
  if (fs.existsSync(localWin)) {
    return { command: localWin, prefixArgs: [], quietPrefixArgs: [], source: "local" };
  }
  if (fs.existsSync(localUnix)) {
    return { command: localUnix, prefixArgs: [], quietPrefixArgs: [], source: "local" };
  }

  const fromPath = findExecutableOnPath(bin);
  if (fromPath) {
    return { command: fromPath, prefixArgs: [], quietPrefixArgs: [], source: "path" };
  }

  const dlx = resolveDlxInvocation(packageManager, bin);
  return {
    command: dlx.command,
    prefixArgs: dlx.args,
    quietPrefixArgs: dlx.quietArgs,
    source: "dlx",
  };
}

export function formatCliCommand(invocation: CliInvocation, args: string[]): string {
  const binName = path.basename(invocation.command).replace(/\.cmd$/i, "");
  const head =
    invocation.source === "dlx" ? [invocation.command, ...invocation.prefixArgs] : [binName];
  return [...head, ...args].join(" ");
}

function findExecutableOnPath(bin: string): string | undefined {
  const pathEnv = process.env["PATH"] ?? "";
  const extensions = process.platform === "win32" ? [".cmd", ".exe", ".bat", ""] : [""];
  for (const dir of pathEnv.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = path.join(dir, bin + ext);
      try {
        fs.accessSync(candidate, fs.constants.X_OK);
        return candidate;
      } catch {
        /* not executable / missing */
      }
    }
  }
  return undefined;
}
