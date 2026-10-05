import {
  BENCHMARK_CANONICAL_URL,
  LANGUAGE_BENCHMARK_URL,
  MODEL_BOARD_UPDATED_ISO,
  modelBoardRows,
} from "@/lib/benchmark-agent-data";
import { BRIEFS, MODEL_BOARD_SIZE } from "@/lib/benchmark-data";
import type { Metadata } from "next";
import { BenchmarkDetailPage } from "../BenchmarkDetailPage";

export const metadata: Metadata = {
  title: "OpenUI language and model benchmark | OpenUI",
  description: `Compare structural validity and measured cost across ${MODEL_BOARD_SIZE} models generating OpenUI, with exact server-rendered data and machine-readable downloads.`,
  alternates: {
    canonical: "/benchmarks/language",
    types: {
      "application/json": "/benchmarks/language/data.json",
      "text/csv": "/benchmarks/language/data.csv",
      "text/markdown": "/benchmarks/language/agent.md",
    },
  },
  openGraph: {
    type: "article",
    url: "/benchmarks/language",
    title: "OpenUI language and model benchmark",
    description: `Structural validity and cost across ${MODEL_BOARD_SIZE} models generating OpenUI.`,
    modifiedTime: MODEL_BOARD_UPDATED_ISO,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "@id": `${LANGUAGE_BENCHMARK_URL}#dataset`,
  name: "OpenUI language and model benchmark",
  description: `Structural validity and measured cost across ${MODEL_BOARD_SIZE} models generating OpenUI.`,
  url: LANGUAGE_BENCHMARK_URL,
  dateModified: MODEL_BOARD_UPDATED_ISO,
  isPartOf: { "@id": `${BENCHMARK_CANONICAL_URL}#dataset` },
  measurementTechnique: `${BENCHMARK_CANONICAL_URL}/methodology`,
  variableMeasured: ["Structural validity percentage", "Cost per task in USD"],
  distribution: [
    {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${LANGUAGE_BENCHMARK_URL}/data.json`,
    },
    {
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: `${LANGUAGE_BENCHMARK_URL}/data.csv`,
    },
    {
      "@type": "DataDownload",
      encodingFormat: "text/markdown",
      contentUrl: `${LANGUAGE_BENCHMARK_URL}/agent.md`,
    },
  ],
};

const costLabel = (row: (typeof modelBoardRows)[number]) =>
  row.cost_per_task_usd === null
    ? "Not comparable"
    : row.cost_per_task_usd === 0
      ? "$0 / free"
      : `$${row.cost_per_task_usd.toFixed(4)}`;

export default function LanguageBenchmarkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <BenchmarkDetailPage
        eyebrow="OpenUI benchmark · Models"
        title="OpenUI language and model benchmark"
        description="How reliably and economically do different models generate structurally valid OpenUI?"
        sections={[
          { id: "answer", label: "What this answers" },
          { id: "results", label: "All model results" },
          { id: "interpretation", label: "How to interpret it" },
          { id: "downloads", label: "Agent-readable data" },
        ]}
        sibling={{ href: "/benchmarks/framework", label: "Framework benchmark" }}
        downloads={[
          { href: "/benchmarks/language/agent.md", label: "Agent Markdown" },
          { href: "/benchmarks/language/data.json", label: "JSON" },
          { href: "/benchmarks/language/data.csv", label: "CSV" },
          { href: "/benchmarks/data.json", label: "Combined dataset" },
        ]}
      >
        <section id="answer" aria-labelledby="answer-heading">
          <h2 id="answer-heading">What this benchmark answers</h2>
          <p>
            This benchmark compares {modelBoardRows.length} models under the same OpenUI task:{" "}
            {BRIEFS} interface briefs, four generations per brief, scored for structural validity.
            The chart pairs that score with measured list-price cost per generated task where a
            comparable API price exists.
          </p>
          <p>
            A high score means the generated component graph parsed, produced a root, resolved its
            references, used valid required and enum props, avoided truncation, and met the shared
            component-count floor. It is not a general intelligence score.
          </p>
        </section>

        <section id="results" aria-labelledby="results-heading">
          <h2 id="results-heading">All model results</h2>
          <p>
            All {modelBoardRows.length} rows are present below, including the five compact or local
            models deselected by default in the visual chart, which opens on models at or above 70%.
          </p>
          <div className="not-prose overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">
                OpenUI structural validity and measured cost across models
              </caption>
              <thead>
                <tr className="border-b border-[color:var(--home-hairline)]">
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Model
                  </th>
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Provider
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Valid
                  </th>
                  <th scope="col" className="py-3 pr-5 text-right font-medium">
                    Cost / task
                  </th>
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Pricing
                  </th>
                  <th scope="col" className="py-3 pr-5 font-medium">
                    Pareto
                  </th>
                  <th scope="col" className="py-3 font-medium">
                    Default view
                  </th>
                </tr>
              </thead>
              <tbody>
                {modelBoardRows.map((row) => (
                  <tr key={row.model_id} className="border-b border-[color:var(--home-hairline)]">
                    <th scope="row" className="py-3 pr-5 font-medium">
                      {row.model_name}
                    </th>
                    <td className="py-3 pr-5">{row.provider}</td>
                    <td className="py-3 pr-5 text-right tabular-nums">
                      {row.validity_score_percent.toFixed(1)}%
                    </td>
                    <td className="py-3 pr-5 text-right tabular-nums">{costLabel(row)}</td>
                    <td className="py-3 pr-5">{row.cost_type}</td>
                    <td className="py-3 pr-5">{row.pareto_frontier ? "Yes" : "No"}</td>
                    <td className="py-3">{row.default_selected ? "Shown" : "Hidden"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="interpretation" aria-labelledby="interpretation-heading">
          <h2 id="interpretation-heading">How to interpret it</h2>
          <ul>
            <li>Provider color identifies a company; it is not a quality highlight.</li>
            <li>
              A Pareto point is not dominated on both measured cost and structural validity. It is
              not a general model ranking.
            </li>
            <li>
              Self-hosted cost is recorded as null because there is no comparable API list price.
              Null does not mean free.
            </li>
            <li>
              Every row is scored by one build of the shipped OpenUI parser, lang-core 0.2.16, whose
              parser validates enum and scalar prop values.
            </li>
          </ul>
          <p>
            The exact generation and scoring condition is documented on the{` `}
            <a href="/benchmarks/methodology">methodology page</a>.
          </p>
        </section>
      </BenchmarkDetailPage>
    </>
  );
}
