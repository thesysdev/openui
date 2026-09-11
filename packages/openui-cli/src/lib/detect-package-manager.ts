export type PackageManagerName = "pnpm" | "yarn" | "bun" | "npm";

export interface PackageManager {
  name: PackageManagerName;
  installCmd: string;
  installArgs: string[];
  runCmd: string;
  dlxCmd: string;
  quietArgs: string[];
}

const PACKAGE_MANAGERS: Record<PackageManagerName, PackageManager> = {
  pnpm: {
    name: "pnpm",
    installCmd: "pnpm install",
    installArgs: ["install"],
    runCmd: "pnpm",
    dlxCmd: "pnpm dlx",
    quietArgs: ["--reporter=silent"],
  },
  yarn: {
    name: "yarn",
    installCmd: "yarn",
    installArgs: [],
    runCmd: "yarn",
    dlxCmd: "yarn dlx",
    quietArgs: ["--quiet"],
  },
  bun: {
    name: "bun",
    installCmd: "bun install",
    installArgs: ["install"],
    runCmd: "bun",
    dlxCmd: "bunx",
    quietArgs: ["--silent"],
  },
  npm: {
    name: "npm",
    installCmd: "npm ci --prefer-offline --no-audit --no-fund --progress=false",
    installArgs: ["ci", "--prefer-offline", "--no-audit", "--no-fund", "--progress=false"],
    runCmd: "npm",
    dlxCmd: "npx",
    quietArgs: ["--yes", "--quiet"],
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

/** Run a published CLI through npm's Node-compatible executor. */
export function resolveDlxInvocation(pkg: string): {
  command: string;
  args: string[];
  quietArgs: string[];
} {
  return {
    command: "npx",
    args: ["--yes", pkg],
    quietArgs: ["--yes", "--quiet", pkg],
  };
}
