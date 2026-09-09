export type DeploySuccessSummary = {
  url?: string;
  inspect?: string;
};

/** Print the deployment URL and inspect link after a quiet success. */
export function printQuietDeploySuccess(summary: DeploySuccessSummary, durationMs: number): void {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  console.info(`✓ Deployed in ${seconds}s`);
  if (summary.url) console.info(`  ${summary.url}`);
  if (summary.inspect) console.info(`  Inspect  ${summary.inspect}`);
  console.info("");
}
