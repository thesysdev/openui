import { benchmarkDataSchema } from "@/lib/benchmark-data-schema";

export const dynamic = "force-static";
export const revalidate = false;

export function GET() {
  return Response.json(benchmarkDataSchema, {
    headers: {
      "Content-Type": "application/schema+json; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Disposition": 'inline; filename="openui-generative-ui-benchmark.schema.json"',
    },
  });
}
