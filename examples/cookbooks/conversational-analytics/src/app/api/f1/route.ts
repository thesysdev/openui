import { f1ToolSpecs } from "../../../lib/f1/tools";

export const runtime = "nodejs";

// Lists the F1 tools with their input schemas and example outputs.
export function GET() {
  return Response.json({ tools: f1ToolSpecs() });
}
