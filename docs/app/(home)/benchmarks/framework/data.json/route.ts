import { frameworkBenchmarkDataset } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return Response.json(frameworkBenchmarkDataset, {
    headers: {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="generative-ui-framework-benchmark.json"',
    },
  });
}
