import { languageBenchmarkMarkdown } from "@/lib/benchmark-agent-data";

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  return new Response(languageBenchmarkMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Content-Disposition": 'inline; filename="openui-language-model-benchmark.md"',
    },
  });
}
