import { frameworkComparisonCsv } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new Response(frameworkComparisonCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="generative-ui-framework-benchmark.csv"',
    },
  });
}
