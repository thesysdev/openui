import { frameworkBenchmarkMarkdown } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new Response(frameworkBenchmarkMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="generative-ui-framework-benchmark.md"',
    },
  });
}
