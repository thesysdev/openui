import { benchmarkAgentDataset } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return Response.json(benchmarkAgentDataset, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Disposition": 'inline; filename="openui-generative-ui-benchmark.json"',
      Link: `<${benchmarkAgentDataset.$schema}>; rel="describedby"`,
    },
  });
}
