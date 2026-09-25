import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { GatewayPlans } from "../cloud/gateway/GatewayPlans";
import heroStyles from "../cloud/gateway/page.module.css";
import layout from "../cloud/gateway/sections.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import pageStyles from "../page.module.css";
import { FaqSection, type MarketingFaq } from "../sections/FaqSection/FaqSection";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { ProductLabel } from "../sections/ProductSection/ProductSection";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "OpenUI Pricing",
  description:
    "OpenUI is MIT licensed and free forever. Add OpenUI Gateway for production reliability and OpenUI Observability for agent product analytics.",
  alternates: { canonical: "/pricing" },
};

const BILLING_DETAILS: GridFeature[] = [
  {
    icon: "chart",
    title: "Pay only provider rates",
    description:
      "Keep model spend predictable with zero token markup, or bring your existing provider keys.",
  },
  {
    icon: "shield",
    title: "Never pay extra for repair",
    description: "Every validation and correction call is already included in your Gateway plan.",
  },
  {
    icon: "database",
    title: "Keep requests private",
    description: "Chat Completions requests use zero data retention by default.",
  },
];

// Existing answers from the homepage and product FAQs; no new pricing policy.
const PRICING_FAQS: MarketingFaq[] = [
  {
    question: "Is OpenUI free and open source?",
    answer: [
      "Yes. OpenUI is fully open source and works with your own models, infrastructure, components, and design system.",
      "OpenUI Gateway and OpenUI Observability are managed services for teams running Generative UI in production.",
    ],
  },
  {
    question: "Which model handles corrections, and are they billed separately?",
    answer: [
      "Corrections use a dedicated model tuned for low latency, which we continue to improve. All correction calls are included in your plan and are not billed separately.",
    ],
  },
  {
    question: "What does OpenUI Observability cost?",
    answer: [
      "OpenUI Observability is free during early access. Pricing will be published before paid access begins.",
    ],
  },
  {
    question: "Do I need both Gateway and Observability?",
    answer: [
      "No. They work independently.",
      "We recommend using both. Gateway makes generated UI more reliable. Observability shows what users experienced and whether it worked.",
    ],
  },
];

function ProductChips({ points }: { points: string[] }) {
  return (
    <ul className={styles.productChips}>
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className={pageStyles.page}>
      <main>
        <div className={styles.hero}>
          <HeroSection
            align="left"
            title={
              <span className={`${heroStyles.titleBlock} ${styles.titleBlock}`}>
                <span className={heroStyles.eyebrow}>Pricing</span>
                <span className={heroStyles.title}>
                  Three ways
                  <br />
                  to use OpenUI.
                </span>
              </span>
            }
            subtitle={
              <span className={heroStyles.subtitle}>
                Start with the open-source framework. Add Gateway for reliable production use and
                Observability to understand what your users experience.
              </span>
            }
            smallSubtitle
            tightDesktopSpacing={false}
            splitLockup
            flushInnerInlinePadding
            showCommand={false}
            showPreview={false}
            showPlaygroundButton={false}
            showGitHubBanner={false}
            showTagline={false}
          />
        </div>

        <div className={styles.softBand}>
          <section
            id="open-source-pricing"
            className={`${layout.section} ${styles.productSection} ${styles.compactProductSection}`}
            aria-labelledby="open-source-title"
          >
            <div className={layout.sectionLockup}>
              <div className={styles.productLead}>
                <ProductLabel name="OpenUI" tag="Open source" />
                <h2 id="open-source-title" className={layout.heading}>
                  Generative UI,
                  <br />
                  free by design.
                </h2>
                <BevelButton
                  href="/docs/openui-lang"
                  variant="primary"
                  label="Get started"
                  badge={<ArrowRight size={16} />}
                />
              </div>
              <div className={styles.productSupport}>
                <p className={layout.lead}>
                  Build agent-driven interfaces with any model, backend framework, client, or design
                  system. Run it wherever you want with no usage limits from us.
                </p>
                <ProductChips
                  points={["Open source forever", "Self-host anywhere", "Bring your whole stack"]}
                />
              </div>
            </div>
          </section>
        </div>

        <section
          className={`${layout.section} ${styles.productSection}`}
          aria-labelledby="gateway-plans"
        >
          <div className={layout.sectionLockup}>
            <div className={styles.productLead}>
              <ProductLabel name="OpenUI" tag="Gateway" />
              <h2 id="gateway-plans" className={`${layout.heading} ${styles.gatewayTitle}`}>
                Reliability for production
                <br />
                Generative UI.
              </h2>
            </div>
            <div className={styles.supporting}>
              <p className={layout.lead}>
                Ship Generative UI your users can trust. Gateway repairs invalid output, keeps
                requests moving through provider outages, and shows where usage and spend go.
              </p>
              <p className={styles.priceNote}>From $0 per month</p>
            </div>
          </div>

          <div className={layout.diagram}>
            <GatewayPlans detailed />
          </div>
          {/* Restore the shared <LogoStrip variant="cloud" /> here after Rabi confirms
              which Gateway customer logos are approved for public use. */}
          <div className={styles.billingDetails}>
            <FeatureGridSection
              features={BILLING_DETAILS}
              showHeader={false}
              showCompat={false}
              showBottomSeparator={false}
              flushOuterCards
              flushSectionPadding
              mobileAccordion={false}
            />
          </div>
          <p className={styles.freeModelNote}>
            API calls are included in each plan. LLM tokens are billed separately at provider rates.
            Annual billing saves up to 20%. Free models have zero LLM cost.
          </p>
        </section>

        <div className={styles.softBand}>
          <section
            id="observability-pricing"
            className={`${layout.section} ${styles.productSection} ${styles.compactProductSection}`}
            aria-labelledby="observability-pricing-title"
          >
            <div className={layout.sectionLockup}>
              <div className={styles.productLead}>
                <ProductLabel name="OpenUI" tag="Observability" />
                <h2 id="observability-pricing-title" className={layout.heading}>
                  Free while in early access.
                </h2>
                <BevelButton
                  href="/cloud/observability"
                  variant="primary"
                  label="Join waitlist"
                  badge={<ArrowRight size={16} />}
                />
              </div>
              <div className={styles.productSupport}>
                <p className={layout.lead}>
                  See what users saw, find the sessions worth opening, and turn problematic
                  responses into feedback and evals.
                </p>
                <ProductChips
                  points={["Session replay", "AI-assisted triage", "Feedback into evals"]}
                />
              </div>
            </div>
          </section>
        </div>

        <div className={`${layout.section} ${styles.faqBand}`}>
          <FaqSection faqs={PRICING_FAQS} titleId="pricing-faq" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
