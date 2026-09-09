"use client";

import { CompletionByModel, CostPerPass, TokenMatrix } from "@/components/charts/benchmark-charts";
import { BlankScreensPanels } from "@/components/charts/blank-screens-panels";
import { CompletionByDensity } from "@/components/charts/completion-by-density";
import { VizSkin } from "@/components/charts/primitives";
import { ReliabilityByModel } from "@/components/charts/reliability-by-model";
import { RenderSplit } from "@/components/charts/render-split";
import { RepairFunnelFlow } from "@/components/charts/repair-funnel-flow";
import { SpeedTokens } from "@/components/charts/speed-tokens";
import {
  blankScreens,
  BRIEFS,
  completionByDensity,
  completionOver,
  COST_MODELS,
  costPerPass,
  FORMAT_ORDER,
  LINKS,
  MODEL_BOARD_SIZE,
  MODELS,
  production,
  repairedShare,
  RUNS_PER_FORMAT,
} from "@/lib/benchmark-data";
import { ChartLineUp, CurrencyDollarSimple, ShieldCheck, Wrench } from "@phosphor-icons/react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { CloudCtaSection } from "../cloud/CloudCtaSection";
import { BevelButton } from "../components/Button/BevelButton";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import s from "./benchmarks.module.css";

const ALL_MODELS = MODELS.map((model) => model.id);
const BLOG_HREF = "/blog/generative-ui-benchmark";

const BLANK_RATE = (1 - blankScreens.openui / RUNS_PER_FORMAT) * 100;

const costRatios = COST_MODELS.flatMap((model) =>
  (["a2ui", "jsonRender"] as const).map(
    (format) => costPerPass[model]![format] / costPerPass[model]!.openui,
  ),
);
const CHEAPER_LOW = Math.min(...costRatios);
const CHEAPER_HIGH = Math.max(...costRatios);

const HARDEST_SCREENS = completionByDensity[completionByDensity.length - 1];

/* The four headline results, written for someone who has never read a
   benchmark. Every number is derived above, never typed. */
const HEADLINE_FEATURES: GridFeature[] = [
  {
    Icon: ShieldCheck,
    title: `${BLANK_RATE.toFixed(1)}% render rate`,
    description: `Only ${blankScreens.openui} of ${RUNS_PER_FORMAT.toLocaleString()} screens rendered blank.`,
  },
  {
    Icon: ChartLineUp,
    title: `${completionOver("openui").toFixed(1)}% valid`,
    description: "Parsed, rooted, and passed every structural check.",
  },
  {
    Icon: CurrencyDollarSimple,
    title: `${CHEAPER_LOW.toFixed(1)} to ${CHEAPER_HIGH.toFixed(1)}× cheaper`,
    description: "Half the tokens: lower cost, faster streaming.",
  },
  {
    Icon: Wrench,
    title: `${repairedShare().toFixed(0)}% repaired in flight`,
    description: "A sanitizer model patches only the broken lines, via incremental editing.",
  },
];

function Section({
  id,
  title,
  question,
  description,
  insight,
  band,
  hideChartHead = false,
  spacious = false,
  children,
}: {
  id: string;
  title: string;
  question?: string;
  description: ReactNode;
  insight: ReactNode;
  band?: string;
  hideChartHead?: boolean;
  spacious?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`${s.section} ${hideChartHead ? s.sectionBare : ""} ${
        spacious ? s.sectionSpacious : ""
      }`}
      aria-labelledby={`${id}-heading`}
    >
      <div className={s.sectionHeader}>
        <div className={s.sectionHeading}>
          {band ? <p className={s.bandLabel}>{band}</p> : null}
          <h2 id={`${id}-heading`} className={s.sectionTitle}>
            {title}
          </h2>
          {question ? <p className={s.sectionQuestion}>{question}</p> : null}
        </div>
        <div className={s.sectionAside}>
          <p>{description}</p>
        </div>
      </div>
      <div className={s.insightBar}>
        <p>{insight}</p>
      </div>
      <div className={s.sectionBody}>{children}</div>
    </section>
  );
}

export function BenchmarksContent() {
  return (
    <main id="benchmark-content" className={s.page}>
      <VizSkin vivid>
        <header className={s.hero}>
          <div className={s.heroLockup}>
            <p className={s.heroAside}>
              {MODEL_BOARD_SIZE} models on OpenUI, plus a 6-model comparison across 3 generative UI
              formats
            </p>
            <div className={s.heroCopy}>
              <p className={s.heroEyebrow}>
                <span>OpenUI</span>
                <span className={s.heroTag}>Benchmarks</span>
              </p>
              <h1 className={s.heroTitle}>
                <span>Generative UI</span> <span>Benchmark</span>
              </h1>
            </div>
            <div className={s.heroActions}>
              <BevelButton
                href="/benchmarks/methodology"
                label="Methodology"
                variant="primary"
                className={s.heroButton}
                badge={
                  <ArrowUpRight className={s.actionIcon} strokeWidth={2.25} aria-hidden="true" />
                }
              />
              <BevelButton
                href={LINKS.rawData}
                label="Raw data"
                variant="secondary"
                className={s.heroButton}
                external
                badge={
                  <ArrowUpRight className={s.actionIcon} strokeWidth={2.25} aria-hidden="true" />
                }
              />
            </div>
          </div>
        </header>

        <section className={s.heroGrid} aria-label="Benchmark overview">
          <ReliabilityByModel models={ALL_MODELS} formats={FORMAT_ORDER} />
        </section>

        <div className={s.featureBand} aria-labelledby="headline-results-heading">
          <h2 id="headline-results-heading" className={s.srOnly}>
            Headline results
          </h2>
          <FeatureGridSection
            features={HEADLINE_FEATURES}
            showHeader={false}
            showCompat={false}
            showBottomSeparator={false}
            showTopSeparator
            desktopColumns={4}
          />
        </div>

        <div className={s.column}>
          <Section
            id="blank-screens"
            title="Blank screens vs. renders"
            question="Did the generation actually render?"
            description={
              <>
                1,104 runs per format across 6 models. <br />
                Counted as each SDK&rsquo;s own renderer produced them.
              </>
            }
            insight={
              <>
                OpenUI had {blankScreens.openui} blank screen in {RUNS_PER_FORMAT.toLocaleString()}{" "}
                runs, compared with {blankScreens.a2ui} for A2UI and {blankScreens.jsonRender} for
                json-render.
              </>
            }
            hideChartHead
          >
            <BlankScreensPanels models={ALL_MODELS} formats={FORMAT_ORDER} />
          </Section>

          <Section
            id="render-split"
            title="Structural validity vs. render success"
            question="Was the output valid, and did anything render?"
            description={
              <>
                Valid: every part it refers to exists, and every setting is a real one. Render
                success: something appeared at all. 1,104 runs per format.
              </>
            }
            insight={
              <>OpenUI leads on both; A2UI and json-render each trade one off against the other.</>
            }
            hideChartHead
          >
            <RenderSplit models={ALL_MODELS} formats={FORMAT_ORDER} />
          </Section>

          <Section
            id="completion"
            title="Structural validity by model"
            question="How often the component graph holds together"
            description={
              <>
                Passes only if nothing is left dangling, nothing is invented, and every setting is
                valid. 184 runs per model, per format.
              </>
            }
            insight={
              <>
                OpenUI leads overall: {completionOver("openui").toFixed(1)}% vs{" "}
                {completionOver("a2ui").toFixed(1)}% for A2UI. The lead changes by model, with two
                ties.
              </>
            }
            hideChartHead
          >
            <CompletionByModel
              models={ALL_MODELS}
              formats={FORMAT_ORDER}
              sub="Runs whose component graph parses, resolves and validates, judged by each format's own SDK."
              note={null}
            />
          </Section>

          <Section
            id="cost"
            title="Token consumption and cost"
            question="Tokens and dollars for the same screens"
            description={
              <>
                46 screens, <br />
                priced at provider list prices.
              </>
            }
            insight={
              <>
                OpenUI uses fewer tokens and costs {CHEAPER_LOW.toFixed(1)}–
                {CHEAPER_HIGH.toFixed(1)}× less across every priced model.
              </>
            }
            spacious
          >
            <TokenMatrix
              formats={FORMAT_ORDER}
              sub="System prompt + output for one screen"
              note={null}
            />
            <CostPerPass
              models={ALL_MODELS}
              formats={FORMAT_ORDER}
              sub={`The same ${BRIEFS} screens at list prices`}
              note={null}
            />
          </Section>

          <Section
            id="speed"
            title="Streaming speed"
            question="How long a screen takes to render"
            description={
              <>
                Mean output per screen, <br />
                decoded at 50 tokens per second.
              </>
            }
            insight="A screen streams in about half the time, because there is about half as much to write."
            hideChartHead
          >
            <SpeedTokens note={null} />
          </Section>

          <Section
            id="density"
            title="Structural validity by screen complexity"
            question="Validity as requirements increase"
            description={
              <>
                46 briefs across 5 complexity bands, <br />
                about 9 per band.
              </>
            }
            insight={
              <>
                As screens get harder, OpenUI and A2UI stay above 90%; json-render falls to{" "}
                {HARDEST_SCREENS.jsonRender.toFixed(0)}%.
              </>
            }
            hideChartHead
          >
            <CompletionByDensity models={ALL_MODELS} formats={FORMAT_ORDER} note={null} />
          </Section>
        </div>

        <div className={s.productionBand}>
          <div className={s.column}>
            <Section
              id="production"
              title="Production repair"
              question="What gets fixed before users see it"
              description={
                <>
                  Based on real production data: <br />
                  OpenUI Cloud traffic, not benchmark runs.
                </>
              }
              insight={
                <>
                  Only {production.userVisibleShare}% of generations reach a user broken. Of the
                  ones that fail validation, {repairedShare().toFixed(0)}% are repaired via
                  incremental editing.
                </>
              }
              hideChartHead
            >
              <RepairFunnelFlow />
            </Section>
          </div>
        </div>

        <CloudCtaSection
          title="Improve your Generative UI reliability with OpenUI Gateway."
          primary={{
            label: "Get OpenUI Gateway",
            href: "https://console.thesys.dev/keys",
            external: true,
          }}
          secondary={{ label: "Learn more", href: "/cloud/gateway" }}
        />
      </VizSkin>
    </main>
  );
}
