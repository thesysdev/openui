import type { DeploySuccessSummary } from "../../deploy/quiet";

/** Parse the stable alias, unique deployment URL, and inspect link from `vercel` output. */
export function extractVercelDeploymentSummary(log: string): DeploySuccessSummary {
  const text = stripAnsi(log).replace(/\r/g, "\n");
  const aliased = labeledUrl(text, "Aliased");
  const production = labeledUrl(text, "Production");
  const preview = labeledUrl(text, "Preview");
  const unique = production ?? preview ?? bareDeploymentUrl(text);
  const url = aliased ?? unique;
  return {
    url,
    deploymentUrl: unique && unique !== url ? unique : undefined,
    inspect: labeledUrl(text, "Inspect"),
  };
}

/** Vercel pads labels to a column; ignore an optional colon and trailing junk. */
function labeledUrl(text: string, label: string): string | undefined {
  const pattern = new RegExp(`^\\s*${label}\\s*:?\\s+(https://\\S+)`, "im");
  const match = text.match(pattern)?.[1];
  return match ? cleanUrl(match) : undefined;
}

/** Last https URL on its own line — `vercel` writes the unique deployment URL to stdout. */
function bareDeploymentUrl(text: string): string | undefined {
  const matches = [...text.matchAll(/^\s*(https:\/\/[a-z0-9.-]+\.vercel\.app\/?)\s*$/gim)];
  const last = matches.at(-1)?.[1];
  return last ? cleanUrl(last) : undefined;
}

function cleanUrl(value: string): string {
  return value.replace(/[)\],.;]+$/g, "");
}

function stripAnsi(value: string): string {
  return value.replace(/\x1B\[[0-9;]*[mK]/g, "");
}
