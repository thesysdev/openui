import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { BENCHMARK_CANONICAL_URL } from "@/lib/benchmark-agent-data";
import {
  BRIEFS,
  CATALOG_COMPONENTS,
  FORMATS,
  LINKS,
  MODELS,
  REPO_ROOT,
  RUNS_PER_FORMAT,
} from "@/lib/benchmark-data";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../../components/Button/BevelButton";
import { PillLink } from "../../components/Button/Button";
import benchmarkStyles from "../benchmarks.module.css";

export const metadata: Metadata = {
  title: "Benchmark methodology | OpenUI",
  description:
    "How the OpenUI generative UI benchmark is run and scored: 46 briefs, 70 equivalent components, controlled generation settings, and SDK-native validation.",
  alternates: { canonical: "/benchmarks/methodology" },
  openGraph: {
    type: "article",
    url: "/benchmarks/methodology",
    title: "Generative UI benchmark methodology | OpenUI",
    description: "A concise explanation of how the benchmark is generated and scored.",
    modifiedTime: "2026-08-26",
  },
};

const SECTIONS = [
  { id: "setup", label: "Benchmark setup" },
  { id: "scoring", label: "What counts as valid" },
  { id: "reproduce", label: "Reproduce the results" },
  { id: "notes", label: "Important notes" },
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": `${BENCHMARK_CANONICAL_URL}/methodology#article`,
  headline: "Generative UI benchmark methodology",
  description: "How the OpenUI generative UI benchmark is generated, scored, and reproduced.",
  url: `${BENCHMARK_CANONICAL_URL}/methodology`,
  dateModified: "2026-08-26",
  author: { "@type": "Organization", name: "OpenUI by Thesys" },
  isPartOf: { "@id": `${BENCHMARK_CANONICAL_URL}#dataset` },
  codeRepository: REPO_ROOT,
};

export default function BenchmarkMethodologyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <div className="min-h-screen bg-[linear-gradient(to_bottom,var(--openui-foreground),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--openui-foreground))] [[data-theme=dark]_&]:bg-[linear-gradient(to_bottom,#000,var(--swatch-neutral-950)_28rem,var(--swatch-neutral-950)_calc(100%_-_28rem),#000)]">
        <main className="mx-auto flex w-full max-w-[var(--home-container-wide)] gap-4 px-4 pt-16 pb-40 lg:gap-28 lg:pr-8 min-[1249px]:pl-0 min-[1024px]:max-[1248px]:pl-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-sm font-medium text-fd-foreground">On this page</p>
              <ul className="space-y-2 text-sm text-[color:var(--openui-text-neutral-tertiary)]">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <h1 className="mb-2 text-[length:var(--home-title-size)] font-[family-name:var(--home-font-display)] font-medium leading-[var(--home-title-leading)] tracking-[var(--home-title-tracking)] text-[color:var(--openui-text-neutral-primary)]">
              Methodology
            </h1>
            <p className="mb-4 text-[length:var(--home-lead-size)] font-[family-name:var(--home-font-text)] leading-[var(--home-lead-leading)] text-[color:var(--openui-text-neutral-secondary)]">
              One catalog, the same 46 interface briefs, and a shared scoring standard.
            </p>
            <nav
              aria-label="Methodology actions"
              className="flex flex-wrap items-center gap-2 border-b border-[color:var(--home-hairline)] pb-6"
            >
              <BevelButton
                href="/benchmarks"
                label="Benchmark"
                variant="secondary"
                className={benchmarkStyles.heroButton}
                badge={
                  <ArrowRight
                    className={benchmarkStyles.actionIcon}
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                }
              />
              <PillLink
                href={REPO_ROOT}
                variant="ghost"
                external
                arrow={<ArrowUpRight size={16} strokeWidth={2.25} aria-hidden="true" />}
              >
                Source
              </PillLink>
            </nav>

            <article className="prose mt-8 min-w-0">
              <section id="setup" aria-labelledby="setup-heading">
                <h2 id="setup-heading">Benchmark setup</h2>
                <p>
                  We test how reliably models generate working interfaces, without telling them
                  which components or layouts to use.
                </p>
                <ul>
                  <li>
                    <strong>{BRIEFS} briefs</strong> across five complexity bands, from simple
                    screens to dense workspaces.
                  </li>
                  <li>
                    <strong>{CATALOG_COMPONENTS} equivalent components</strong> available to every
                    format.
                  </li>
                  <li>
                    <strong>Four generations per brief</strong>, with a 16,384-token output limit.
                  </li>
                  <li>
                    <strong>Temperature 0.7</strong> where supported, with minimal or no reasoning.
                  </li>
                </ul>
                <p>
                  For the framework comparison, the same briefs run across {MODELS.length} models
                  and {FORMATS.length} formats: OpenUI, Google A2UI, and Vercel json-render. That is{" "}
                  {RUNS_PER_FORMAT.toLocaleString("en-US")} generations per format.
                </p>
                <p>
                  Each format uses the prompt generated by its own SDK. All three receive the same
                  two worked examples, and their component catalogs are checked against one shared
                  reference catalog.
                </p>
              </section>

              <section id="scoring" aria-labelledby="scoring-heading">
                <h2 id="scoring-heading">What counts as valid</h2>
                <p>
                  Each format is parsed and validated by its own shipped SDK, followed by the same
                  completeness checks for all three formats.
                </p>
                <p>A generation passes structural validity when it:</p>
                <ul>
                  <li>parses and produces a root;</li>
                  <li>uses known components and valid required or enum props;</li>
                  <li>resolves every reference, with nothing orphaned;</li>
                  <li>does not end because it hit the output limit; and</li>
                  <li>
                    contains at least as many reachable components as the brief has requirements.
                  </li>
                </ul>
                <p>
                  <strong>Render success is separate.</strong> It records whether a non-blank screen
                  appeared at all. A screen can render and still fail structural validity.
                </p>
              </section>

              <section id="reproduce" aria-labelledby="reproduce-heading">
                <h2 id="reproduce-heading">Reproduce the results</h2>
                <p>
                  Raw model outputs and scored verdicts are committed to the benchmark repository.
                  The scorer runs offline, so the published outputs can be rescored without model
                  API keys. Recreating the committed result files with no diff is the integrity
                  check.
                </p>
                <p>
                  The repository README contains the exact Node and A2UI Python setup, plus commands
                  for rescoring one model or the full benchmark.
                </p>
                <p>
                  <a href={LINKS.latestReadme}>Read the reproduction instructions</a> or inspect the{" "}
                  <a href={LINKS.rawOutputs}>published raw outputs</a>.
                </p>
              </section>

              <section id="notes" aria-labelledby="notes-heading">
                <h2 id="notes-heading">Important notes</h2>
                <div className="not-prose my-6 border-l-2 border-[color:var(--openui-text-neutral-primary)] pl-5 text-sm leading-6 text-[color:var(--openui-text-neutral-secondary)]">
                  Every row is scored by one build of the shipped OpenUI parser,{` `}
                  <strong>lang-core 0.2.16</strong>, whose parser validates enum and scalar prop
                  values. Raw outputs and per-run verdicts are committed for independent rescoring.
                </div>
                <ul>
                  <li>
                    The component-count floor prevents tiny valid outputs from passing, but it does
                    not judge visual quality or prove every requirement was understood.
                  </li>
                  <li>
                    Cost uses measured tokens and list prices. Hidden reasoning tokens can make the
                    actual bill higher.
                  </li>
                  <li>
                    Self-hosted model costs are marked as not comparable rather than treated as
                    free.
                  </li>
                  <li>
                    OpenUI built this benchmark. The method and outputs are published so the results
                    can be inspected and challenged.
                  </li>
                </ul>
              </section>
            </article>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
