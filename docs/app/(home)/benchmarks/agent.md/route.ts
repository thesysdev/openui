import { benchmarkAgentMarkdown } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return new Response(benchmarkAgentMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Disposition": 'inline; filename="openui-generative-ui-benchmark.md"',
    },
  });
}
