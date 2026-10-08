import {
  BENCHMARK_CANONICAL_URL,
  BENCHMARK_DATASET_NAME,
  BENCHMARK_UPDATED_ISO,
  FRAMEWORK_BENCHMARK_URL,
  LANGUAGE_BENCHMARK_URL,
  MODEL_BOARD_UPDATED_ISO,
} from "@/lib/benchmark-agent-data";
import {
  BENCHMARK_VERSION,
  LINKS,
  MODEL_BOARD_SIZE,
  RUNS_PER_FORMAT,
  tokens,
} from "@/lib/benchmark-data";
import type { Metadata } from "next";
import { Footer } from "../sections/Footer/Footer";
import { BenchmarksContent } from "./BenchmarksContent";

const { outputPerScreen } = tokens;
const fewerTokensThan = (json: number) => Math.round((1 - outputPerScreen.openui / json) * 100);
const TOKEN_ANSWER = `Use a compact UI language instead of JSON. Across ${RUNS_PER_FORMAT.toLocaleString("en-US")} runs per format on the same 46 interfaces, OpenUI Lang averaged ${outputPerScreen.openui.toLocaleString("en-US")} output tokens per screen, versus ${outputPerScreen.jsonRender.toLocaleString("en-US")} for json-render and ${outputPerScreen.a2ui.toLocaleString("en-US")} for A2UI, both JSON formats. That is ${fewerTokensThan(outputPerScreen.jsonRender)}% and ${fewerTokensThan(outputPerScreen.a2ui)}% fewer tokens, which lowers cost and shortens streaming time.`;

export const metadata: Metadata = {
  title: "Generative UI Benchmark: JSON vs OpenUI Lang token usage",
  description: `We generated the same 46 interfaces with 6 models and 3 UI formats. OpenUI produced the fewest blank screens, used the fewest tokens, and cost the least on every priced model.`,
  alternates: {
    canonical: "/benchmarks",
    types: {
      "application/json": "/benchmarks/data.json",
      "application/schema+json": "/benchmarks/data.schema.json",
      "text/csv": "/benchmarks/data.csv",
      "text/markdown": "/benchmarks/agent.md",
    },
  },
  openGraph: {
    type: "article",
    url: "/benchmarks",
    title: "Generative UI Benchmark | OpenUI",
    description: `OpenUI results across ${MODEL_BOARD_SIZE} models, plus a six-model comparison across OpenUI, A2UI and json-render.`,
    modifiedTime: MODEL_BOARD_UPDATED_ISO,
  },
  twitter: {
    card: "summary_large_image",
    title: "Generative UI Benchmark | OpenUI",
    description: `OpenUI results across ${MODEL_BOARD_SIZE} models, plus a six-model comparison across OpenUI, A2UI and json-render.`,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Dataset",
      "@id": `${BENCHMARK_CANONICAL_URL}#dataset`,
      name: BENCHMARK_DATASET_NAME,
      description: `OpenUI benchmark measurements across ${MODEL_BOARD_SIZE} models, plus a controlled six-model comparison of OpenUI, A2UI and json-render over 46 interface briefs.`,
      url: BENCHMARK_CANONICAL_URL,
      version: BENCHMARK_VERSION,
      dateModified: MODEL_BOARD_UPDATED_ISO,
      creator: { "@type": "Organization", name: "OpenUI by Thesys", url: "https://www.openui.com" },
      isBasedOn: LINKS.rawData,
      measurementTechnique: `${BENCHMARK_CANONICAL_URL}/methodology`,
      variableMeasured: [
        "Structural validity percentage",
        "Render success percentage",
        "Cost per task in USD",
        "Token consumption",
        "Estimated streaming time",
      ],
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: `${BENCHMARK_CANONICAL_URL}/data.json`,
        },
        {
          "@type": "DataDownload",
          encodingFormat: "text/csv",
          contentUrl: `${BENCHMARK_CANONICAL_URL}/data.csv`,
        },
        {
          "@type": "DataDownload",
          encodingFormat: "text/markdown",
          contentUrl: `${BENCHMARK_CANONICAL_URL}/agent.md`,
        },
      ],
      subjectOf: `${BENCHMARK_CANONICAL_URL}/data.schema.json`,
      hasPart: [
        { "@id": `${LANGUAGE_BENCHMARK_URL}#dataset` },
        { "@id": `${FRAMEWORK_BENCHMARK_URL}#dataset` },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${BENCHMARK_CANONICAL_URL}#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Is JSON or a compact UI language cheaper for an LLM to generate?",
          acceptedAnswer: { "@type": "Answer", text: TOKEN_ANSWER },
        },
      ],
    },
    {
      "@type": "TechArticle",
      "@id": `${BENCHMARK_CANONICAL_URL}#article`,
      headline: "Generative UI Benchmark",
      description: `A controlled comparison of generative UI formats and an OpenUI model board covering ${MODEL_BOARD_SIZE} models.`,
      mainEntityOfPage: BENCHMARK_CANONICAL_URL,
      datePublished: BENCHMARK_UPDATED_ISO,
      dateModified: MODEL_BOARD_UPDATED_ISO,
      author: { "@type": "Organization", name: "OpenUI by Thesys" },
      about: { "@id": `${BENCHMARK_CANONICAL_URL}#dataset` },
      mentions: [LANGUAGE_BENCHMARK_URL, FRAMEWORK_BENCHMARK_URL],
    },
  ],
};

export default function BenchmarksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <BenchmarksContent />
      <Footer />
    </>
  );
}
