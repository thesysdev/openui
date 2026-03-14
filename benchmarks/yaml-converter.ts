import { stringify } from "yaml";

import { astToVercelSpec } from "./vercel-spec-converter.js";

export function astToYaml(astRoot: unknown) {
  const spec = astToVercelSpec(astRoot);

  // Strip empty children arrays — they add no information
  for (const el of Object.values(spec.elements)) {
    if (el["children"].length === 0) {
      delete (el as Record<string, unknown>)["children"];
    }
  }

  return stringify(spec, { indent: 2 }).trimEnd();
}
