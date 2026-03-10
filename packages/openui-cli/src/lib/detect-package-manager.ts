type PackageManagerRunner = "npx" | "pnpm dlx" | "yarn dlx" | "bunx";

export function detectPackageManager(): PackageManagerRunner {
  const userAgent = process.env["npm_config_user_agent"] ?? "";

  if (userAgent.startsWith("pnpm/")) return "pnpm dlx";
  if (userAgent.startsWith("yarn/")) return "yarn dlx";
  if (userAgent.startsWith("bun/")) return "bunx";
  return "npx";
}
