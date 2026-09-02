/** Shared options every deploy target receives from `openui deploy`. */
export type DeployTargetOptions = {
  projectDir: string;
  extraArgs: string[];
  prod: boolean;
  yes: boolean;
  skipEnv: boolean;
  noInteractive: boolean;
  verbose: boolean;
};

export const DEPLOY_TARGETS = ["vercel"] as const;
export type DeployTarget = (typeof DEPLOY_TARGETS)[number];
export const DEFAULT_DEPLOY_TARGET: DeployTarget = "vercel";
