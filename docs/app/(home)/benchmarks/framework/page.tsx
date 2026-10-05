import {
  BENCHMARK_CANONICAL_URL,
  BENCHMARK_UPDATED_ISO,
  FRAMEWORK_BENCHMARK_URL,
  formatComparisonRows,
  formatSummaryRows,
} from "@/lib/benchmark-agent-data";
import { BRIEFS, LINKS, MODELS, RUNS_PER_FORMAT, RUNS_TOTAL } from "@/lib/benchmark-data";
import type { Metadata } from "next";
import { BenchmarkDetailPage } from "../BenchmarkDetailPage";

export const metadata: Metadata = {
  title: "Generative UI framework benchmark | OpenUI",
  description:
    "Compare OpenUI, Google A2UI, and Vercel json-render across six models and 46 interface briefs, with exact server-rendered results and downloads.",
  alternates: {
    canonical: "/benchmarks/framework",
    types: {
      "application/json": "/benchmarks/framework/data.json",
      "text/csv": "/benchmarks/framework/data.csv",
      "text/markdown": "/benchmarks/framework/agent.md",
    },
  },
  openGraph: {
    type: "article",
    url: "/benchmarks/framework",
    title: "Generative UI framework benchmark",
    description: "OpenUI versus Google A2UI versus Vercel json-render under one condition.",
    modifiedTime: BENCHMARK_UPDATED_ISO,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "@id": `${FRAMEWORK_BENCHMARK_URL}#dataset`,
  name: "Generative UI framework benchmark",
  description:
    "OpenUI, Google A2UI, and Vercel json-render compared across six models and 46 interface briefs.",
  url: FRAMEWORK_BENCHMARK_URL,
  dateModified: BENCHMARK_UPDATED_ISO,
  isPartOf: { "@id": `${BENCHMARK_CANONICAL_URL}#dataset` },
  isBasedOn: LINKS.rawData,
  measurementTechnique: `${BENCHMARK_CANONICAL_URL}/methodology`,
  variableMeasured: [
    "Structural validity percentage",
    "Render success percentage",
    "Cost per 46-screen pass in USD",
  ],
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${FRAMEWORK_BENCHMARK_URL}/data.json`,
    },
    {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: `${FRAMEWORK_BENCHMARK_URL}/data.csv`,
    },
    {
      "@type": "DataDownload",
      encodingFormat: "text/markdown",
      contentUrl: `${FRAMEWORK_BENCHMARK_URL}/agent.md`,
    },
  ],
};

export default function FrameworkBenchmarkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <BenchmarkDetailPage
        eyebrow="Generative UI benchmark · Frameworks"
        title="Generative UI framework benchmark"
        description="How do OpenUI, Google A2UI, and Vercel json-render compare under the same briefs and generation condition?"
        sections={[
          { id: "answer", label: "What this answers" },
          { id: "summary", label: "Format summary" },
          { id: "results", label: "Results by model" },
          { id: "condition", label: "Controlled condition" },
          { id: "downloads", label: "Agent-readable data" },
        ]}
        sibling={{ href: "/benchmarks/language", label: "Language/model benchmark" }}
        downloads={[
          { href: "/benchmarks/framework/agent.md", label: "Agent Markdown" },
          { href: "/benchmarks/framework/data.json", label: "JSON" },
          { href: "/benchmarks/framework/data.csv", label: "CSV" },
          { href: LINKS.rawData, label: "Published raw results", external: true },
          { href: "/benchmarks/data.json", label: "Combined dataset" },
        ]}
      >
        <section id="answer" aria-labelledby="answer-heading">
          <h2 id="answer-heading">What this benchmark answers</h2>
          <p>
            This is a controlled comparison of three generative UI formats: OpenUI, Google A2UI, and
            Vercel json-render. It covers {MODELS.length} models, {BRIEFS} briefs, and four
            generations per brief: {RUNS_PER_FORMAT.toLocaleString("en-US")} runs per format and{" "}
            {RUNS_TOTAL.toLocaleString("en-US")} scored runs in total.
          </p>
          <p>
            Structural validity and render success are separate. A generation can put something on
            screen while still failing the complete structural checks.
          </p>
        </section>

        <section id="summary" aria-labelledby="summary-heading">
          <h2 id="summary-heading">Format summary</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">Summary results for each generative UI format</caption>
              <thead>
                <tr className="border-b border-[color:var(--home-hairline)]">
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Format
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Structural validity
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Render success
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Blank screens
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    Runs
                  </th>
                </tr>
              </thead>
              <tbody>
                {formatSummaryRows.map((row) => (
                  <tr key={row.format_id} className="border-b border-[color:var(--home-hairline)]">
                    <th scope="row" className="py-3 pr-5 font-medium">
                      {row.format_name}
                    </th>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.validity_score_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.render_rate_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-5 text-right tabular-nums">{row.blank_screens}</td>
                    <td className="py-3 text-right tabular-nums">
                      {row.runs.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="results" aria-labelledby="results-heading">
          <h2 id="results-heading">Results by model and format</h2>
          <div className="not-prose overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Structural validity, render success, and cost by model and format
              </caption>
              <thead>
                <tr className="border-b border-[color:var(--home-hairline)]">
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Model
                  </th>
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Format
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Valid runs
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Validity
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Render success
                  </th>
                  <th scope="col" className="py-3 text-right font-medium">
                    Cost / 46 screens
                  </th>
                </tr>
              </thead>
              <tbody>
                {formatComparisonRows.map((row) => (
                  <tr
                    key={`${row.model_id}-${row.format_id}`}
                    className="border-b border-[color:var(--home-hairline)]"
                  >
                    <th scope="row" className="py-3 pr-5 font-medium">
                      {row.model_name}
                    </th>
                    <td className="py-3 pr-5">{row.format_name}</td>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.valid_runs}/{row.total_runs}
                    </td>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.validity_score_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.render_rate_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 text-right tabular-nums">
                      {row.cost_per_46_screen_pass_usd === null
                        ? "Not available"
                        : `$${row.cost_per_46_screen_pass_usd.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="condition" aria-labelledby="condition-heading">
          <h2 id="condition-heading">Controlled condition</h2>
          <ul>
            <li>One shared catalog of 70 equivalent components.</li>
            <li>Each format uses the prompt generated by its own SDK.</li>
            <li>The same two worked examples are carried by all three prompts.</li>
            <li>Four generations per brief and a 16,384-token output ceiling.</li>
            <li>Temperature 0.7 where supported, with minimal or no reasoning.</li>
            <li>
              Each SDK&rsquo;s shipped validation plus one identical shared completeness layer and
              component-count floor.
            </li>
          </ul>
          <p>
            Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16. See the
            {` `}
            <a href="/benchmarks/methodology">complete methodology and reproduction steps</a>.
          </p>
        </section>
      </BenchmarkDetailPage>
    </>
  );
}
