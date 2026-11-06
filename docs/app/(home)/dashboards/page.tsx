import { Chip } from "@/components/charts/primitives";
import viz from "@/components/charts/viz.module.css";
import { MarketingTable } from "@/components/marketing-table";
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { AgentPicker, DASHBOARDS_SETUP_PROMPT } from "../components/AgentPicker/AgentPicker";
import { BevelButton } from "../components/Button/BevelButton";
import landing from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { LogoStrip } from "../sections/LogoStrip/LogoStrip";
import { DashboardFeatures } from "./DashboardFeatures";
import { DashboardHeroStage, ModelProof } from "./DashboardHero";
import { DashboardIntegration } from "./DashboardIntegration";
import { DashboardNumbers } from "./DashboardNumbers";
import { DashboardStory } from "./DashboardStory";
import { FaqSection } from "./FaqSection";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "OpenUI Dashboards | Live AI dashboards, inside your product" },
  description: "Built by your agent from your components and APIs. No BI tool, no iframe.",
  alternates: { canonical: "/dashboards" },
  openGraph: {
    title: "OpenUI Dashboards | Live AI dashboards, inside your product",
    description: "Interactive dashboards built with your components and your APIs.",
    url: "/dashboards",
    type: "website",
  },
};

/* Kept to what the product verifiably includes. The comparison is with
   model-written HTML that has no runtime around it. */
const COMPARISON = [
  { label: "Safety", without: "Arbitrary scripts", with: "Your tools only" },
  { label: "Speed", without: "Waits for full markup", with: "Streams live" },
  { label: "Reliability", without: "Breaks on bad markup", with: "Self-repairs" },
  { label: "Live data", without: "A frozen snapshot", with: "Always current" },
  { label: "Design", without: "Inline styles", with: "Your components" },
];

export default function DashboardsPage() {
  return (
    <div className={`${homeStyles.page} ${landing.pageFocus} ${styles.page}`}>
      <div className={homeStyles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          title={
            <span className={gatewayStyles.titleBlock}>
              <span className={gatewayStyles.eyebrow}>
                OpenUI <span className={gatewayStyles.cloudTag}>Dashboards</span>
              </span>
              <span className={gatewayStyles.title}>
                <span className={styles.phoneHidden}>Live AI dashboards, inside your product</span>
                <span className={styles.phoneOnly}>AI Dashboards in your product</span>
              </span>
            </span>
          }
          subtitle={
            <span className={`${gatewayStyles.subtitle} ${landing.heroSubtitle}`}>
              Built by your agent from your components and APIs.
              {/* Breaks on desktop only; on a phone the line flows. */}
              <br className={landing.statementBreak} /> No BI tool, no iframe.
            </span>
          }
          commandSlot={
            <div className={styles.heroActions}>
              <div className={styles.heroCtas}>
                <AgentPicker command={DASHBOARDS_SETUP_PROMPT} runner={false} />
                <BevelButton
                  href="https://zcal.co/t/thesys/demo"
                  external
                  variant="secondary"
                  label="Book meeting"
                  badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                />
              </div>
            </div>
          }
          /* The homepage's proof line, in the same slot, naming the models. */
          proofSlot={<ModelProof />}
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={<DashboardHeroStage />}
          mobilePreviewSlot={<DashboardHeroStage />}
        />
        <LogoStrip title="Teams building with OpenUI" />
      </div>

      <main>
        <DashboardStory />

        <DashboardFeatures />

        <DashboardNumbers />

        <DashboardIntegration />

        <section className={styles.section} aria-labelledby="dashboard-compare-title">
          <div className={`${styles.container} ${styles.compare}`}>
            <div className={styles.compareIntro}>
              <h2 id="dashboard-compare-title" className={styles.heading}>
                Why not just generate HTML?
              </h2>
              <p className={styles.lead}>
                Generated HTML is a frozen page: it can&apos;t stream, refresh, or be trusted with
                your data. OpenUI gives you a dashboard that keeps up.
              </p>
            </div>
            <div className={`${viz.viz} ${viz.vivid} ${styles.compareTable}`}>
              <MarketingTable compact edgeToEdgeMobile className={viz.benchmarkTable}>
                <caption className="sr-only">
                  OpenUI Dashboards compared with LLM-written HTML
                </caption>
                <colgroup>
                  <col className={styles.capabilityColumn} />
                  <col />
                  <col />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Capability</span>
                    </th>
                    {/* Same fixed block as the cells below, so the titles
                        share the marks' left edge. */}
                    <th scope="col">
                      <span className={styles.cell}>LLM-written HTML</span>
                    </th>
                    <th scope="col" className={viz.s1}>
                      <span className={`${viz.colHead} ${styles.cell}`}>
                        <Chip mark="openui" />
                        OpenUI Dashboards
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td className={styles.worse}>
                        <span className={styles.cell}>
                          <span aria-hidden="true" className={`${styles.mark} ${styles.markFail}`}>
                            <X size={13} weight="bold" />
                          </span>
                          {row.without}
                        </span>
                      </td>
                      <td className={viz.s1}>
                        <span className={styles.cell}>
                          <span aria-hidden="true" className={`${styles.mark} ${styles.markPass}`}>
                            <Check size={13} weight="bold" />
                          </span>
                          {row.with}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </MarketingTable>
            </div>

            {/* Phones: the same comparison grouped by column — all of HTML
                first, then all of OpenUI — as label/answer rows. */}
            <div className={styles.compareStacked}>
              <div>
                <span className={styles.compareGroupHead}>LLM-written HTML</span>
                {COMPARISON.map((row) => (
                  <div key={row.label} className={styles.compareRow}>
                    <span className={styles.compareRowLabel}>{row.label}</span>
                    <span className={styles.cell}>
                      <span aria-hidden="true" className={`${styles.mark} ${styles.markFail}`}>
                        <X size={13} weight="bold" />
                      </span>
                      {row.without}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <span className={styles.compareGroupHead}>
                  <Chip mark="openui" />
                  OpenUI Dashboards
                </span>
                {COMPARISON.map((row) => (
                  <div key={row.label} className={styles.compareRow}>
                    <span className={styles.compareRowLabel}>{row.label}</span>
                    <span className={styles.cell}>
                      <span aria-hidden="true" className={`${styles.mark} ${styles.markPass}`}>
                        <Check size={13} weight="bold" />
                      </span>
                      {row.with}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className={styles.faqBand}>
          <FaqSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
