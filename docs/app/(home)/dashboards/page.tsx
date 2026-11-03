import { Chip } from "@/components/charts/primitives";
import viz from "@/components/charts/viz.module.css";
import { MarketingTable } from "@/components/marketing-table";
import { ArrowUpRight, Check, X } from "lucide-react";
import type { Metadata } from "next";
import gatewayStyles from "../cloud/gateway/page.module.css";
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
   model-written UI code that has no runtime around it. */
const COMPARISON = [
  { label: "Speed", without: "Waits for full code", with: "Streams live" },
  { label: "Reliability", without: "Breaks on errors", with: "Self-repairs" },
  { label: "Live data", without: "Fetched once", with: "Always current" },
  { label: "Calculated fields", without: "New endpoint", with: "Safe script" },
  { label: "Targeted edits", without: "Full rewrite", with: "Only that part" },
  { label: "Design", without: "Generic UI", with: "Your components" },
  { label: "Safety", without: "Arbitrary code", with: "Your tools only" },
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
              <span className={gatewayStyles.title}>Live AI dashboards, inside your product</span>
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
              <div className={gatewayStyles.ctaGroup}>
                <BevelButton
                  href="https://console.thesys.dev/keys"
                  external
                  variant="primary"
                  label="Get API key"
                  badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                />
                <BevelButton
                  href="/docs/build-agents/ui-generation"
                  variant="secondary"
                  label="Docs"
                  badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                />
              </div>
              <ModelProof />
            </div>
          }
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
                Why not just generate the code?
              </h2>
              <p className={styles.lead}>
                Generated code gives you a screen. OpenUI gives you a dashboard that keeps up.
              </p>
            </div>
            <div className={`${viz.viz} ${viz.vivid} ${styles.compareTable}`}>
              <MarketingTable compact edgeToEdgeMobile className={viz.benchmarkTable}>
                <caption className="sr-only">
                  OpenUI Dashboards compared with LLM-written code
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
                    <th scope="col">LLM-written code</th>
                    <th scope="col" className={viz.s1}>
                      <span className={viz.colHead}>
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
                          <X className={styles.dash} size={14} aria-hidden="true" />
                          {row.without}
                        </span>
                      </td>
                      <td className={viz.s1}>
                        <span className={styles.cell}>
                          <Check className={styles.check} size={16} aria-hidden="true" />
                          {row.with}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </MarketingTable>
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
