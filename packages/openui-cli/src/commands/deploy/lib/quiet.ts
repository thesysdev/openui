export type DeploySuccessSummary = {
  url?: string;
  /** Unique `*.vercel.app` deployment URL when it differs from the alias. */
  deploymentUrl?: string;
  inspect?: string;
};

/** Print the deployment URL and inspect link after a quiet success/start. */
export function printQuietDeploySuccess(
  summary: DeploySuccessSummary,
  durationMs: number,
  noWait = false,
): void {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  console.info(noWait ? `✓ Deployment started in ${seconds}s` : `✓ Deployed in ${seconds}s`);
  if (summary.url) console.info(`  ${summary.url}`);
  if (summary.deploymentUrl && summary.deploymentUrl !== summary.url) {
    console.info(`  ${summary.deploymentUrl}`);
  }
  if (summary.inspect) console.info(`  Inspect  ${summary.inspect}`);
  console.info("");
}
