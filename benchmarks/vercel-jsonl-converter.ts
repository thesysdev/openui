import { astToVercelSpec } from "./vercel-spec-converter.js";

export function astToVercelJsonl(astRoot: unknown) {
  // Vercel json-render uses JSON Patch (RFC 6902) format.
  const spec = astToVercelSpec(astRoot);
  const lines = [JSON.stringify({ op: "add", path: "/root", value: spec.root })];

  for (const [id, value] of Object.entries(spec.elements)) {
    lines.push(
      JSON.stringify({
        op: "add",
        path: `/elements/${id}`,
        value,
      }),
    );
  }

  return lines.join("\n");
}
