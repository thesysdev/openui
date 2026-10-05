import { languageBenchmarkDataset } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return Response.json(languageBenchmarkDataset, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="openui-language-model-benchmark.json"',
    },
  });
}
