import type { DeploySuccessSummary } from "../../deploy/quiet";

/** Parse deployment URL / inspect link from captured `vercel` CLI output. */
export function extractVercelDeploymentSummary(log: string): DeploySuccessSummary {
  return {
    url:
      firstMatch(log, /^\s*Aliased\s+(https:\/\/\S+)/m) ??
      firstMatch(log, /^\s*Production\s+(https:\/\/\S+)/m) ??
      firstMatch(log, /^\s*Preview\s+(https:\/\/\S+)/m),
    inspect: firstMatch(log, /^\s*Inspect\s+(https:\/\/\S+)/m),
  };
}

function firstMatch(text: string, pattern: RegExp): string | undefined {
  return text.match(pattern)?.[1];
}
