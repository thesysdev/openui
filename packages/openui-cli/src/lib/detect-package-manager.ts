export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  installArgs: string[];
  runCmd: string;
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: { name: "pnpm", installCmd: "pnpm install", installArgs: ["install"], runCmd: "pnpm" },
  yarn: { name: "yarn", installCmd: "yarn", installArgs: [], runCmd: "yarn" },
  bun: { name: "bun", installCmd: "bun install", installArgs: ["install"], runCmd: "bun" },
  npm: {
    name: "npm",
    installCmd: "npm ci --prefer-offline --no-audit --no-fund --progress=false",
    installArgs: ["ci", "--prefer-offline", "--no-audit", "--no-fund", "--progress=false"],
    runCmd: "npm",
  },
};

function detectInvokingPackageManager(): PackageManagerName | null {
  const userAgent = process.env["npm_config_user_agent"] ?? "";
  if (userAgent.startsWith("pnpm/")) return "pnpm";
  if (userAgent.startsWith("yarn/")) return "yarn";
  if (userAgent.startsWith("bun/")) return "bun";
  if (userAgent.startsWith("npm/")) return "npm";
  return null;
}

export function resolveInstallPackageManager(): PackageManager {
  const invoking = detectInvokingPackageManager();
  return PACKAGE_MANAGERS[invoking ?? "npm"];
}

/** Run a published package without adding it as a dependency (`npx` / `dlx` / `bunx`). */
export function resolveDlxInvocation(
  packageManager: PackageManager,
  pkg: string,
): { command: string; args: string[]; quietArgs: string[] } {
  switch (packageManager.name) {
    case "pnpm":
      return {
        command: "pnpm",
        args: ["dlx", pkg],
        quietArgs: ["--reporter=silent", "dlx", pkg],
      };
    case "yarn":
      return {
        command: "yarn",
        args: ["dlx", pkg],
        quietArgs: ["dlx", "--quiet", pkg],
      };
    case "bun":
      return { command: "bunx", args: [pkg], quietArgs: ["--silent", pkg] };
    default:
      return {
        command: "npx",
        args: ["--yes", pkg],
        quietArgs: ["--yes", "--quiet", pkg],
      };
  }
}
