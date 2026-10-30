import { SITE_OPEN_GRAPH } from "@/lib/page-metadata";
import { BASE_URL } from "@/lib/source";
import type { Metadata } from "next";
import { AGENT_SETUP_PROMPT, AgentPicker } from "./components/AgentPicker/AgentPicker";
import { LangShowcase } from "./components/LangShowcase/LangShowcase";
import {
  type ComparisonTab,
  ComparisonTabs,
} from "./components/StreamingComparison/ComparisonTabs";
import { AD_SPEND } from "./components/StreamingComparison/examples/adSpend";
import { PARIS_HOTELS } from "./components/StreamingComparison/examples/parisHotels";
import { SALES_DASHBOARD } from "./components/StreamingComparison/examples/salesDashboard";
import { TRIP_FORM } from "./components/StreamingComparison/examples/tripForm";
import styles from "./page.module.css";
import { BANNER_END_ANCHOR_ID } from "./sections/CloudBanner/CloudBanner";
import { CloudSection } from "./sections/CloudSection/CloudSection";
import { CompatibilitySection } from "./sections/CompatibilitySection/CompatibilitySection";
import { FAQS, FaqSection } from "./sections/FaqSection/FaqSection";
import { Footer } from "./sections/Footer/Footer";
import { HeroProof } from "./sections/HeroProof/HeroProof";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { LogoStrip } from "./sections/LogoStrip/LogoStrip";
import { LangHeadline } from "./sections/ProductSection/LangHeadline";
import { LANG_PRODUCT } from "./sections/ProductSection/products";
import { ProductSection } from "./sections/ProductSection/ProductSection";
import { ShiroPeek } from "./sections/ShiroPeek/ShiroPeek";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";

/* The examples under the hero's comparison, one per tab. */
const COMPARISON_TABS: ComparisonTab[] = [
  { id: "charts", label: "Charts", example: AD_SPEND },
  { id: "cards", label: "Cards", example: PARIS_HOTELS },
  { id: "dashboards", label: "Dashboards", example: SALES_DASHBOARD },
  { id: "forms", label: "Forms", example: TRIP_FORM },
];

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: { ...SITE_OPEN_GRAPH, url: "/" },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.thesys.dev/#organization",
      name: "Thesys",
      url: "https://www.thesys.dev",
      logo: {
        "@type": "ImageObject",
        url: "https://www.thesys.dev/thesys-logo-bw.png",
        width: 360,
        height: 360,
      },
      sameAs: [
        "https://github.com/thesysdev",
        "https://x.com/thesysdev",
        "https://www.linkedin.com/company/thesysdev/",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BASE_URL}/#software`,
      name: "OpenUI",
      alternateName: "OpenUI by Thesys",
      url: BASE_URL,
      description:
        "Full-stack, framework-agnostic Generative UI built on OpenUI Lang, a streaming-first language with first-party runtimes for React, Vue, Svelte, and Angular.",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Cross-platform",
      license: "https://opensource.org/licenses/MIT",
      creator: { "@id": "https://www.thesys.dev/#organization" },
      publisher: { "@id": "https://www.thesys.dev/#organization" },
      softwareHelp: { "@type": "CreativeWork", url: `${BASE_URL}/docs` },
      sameAs: [
        "https://github.com/thesysdev/openui",
        "https://www.npmjs.com/org/openuidev",
        "https://x.com/openuidev",
        "https://www.linkedin.com/showcase/openui-com/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      name: "OpenUI",
      alternateName: "OpenUI by Thesys",
      url: BASE_URL,
      publisher: { "@id": "https://www.thesys.dev/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": `${BASE_URL}/#faq`,
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer.join(" ") },
      })),
    },
  ],
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      {/* Five folds, in order: the hero, what OpenUI does, how it works, what
          it works with, then questions. Gateway and the tweet wall sit between
          the last two so they never interrupt that story. */}
      <div className={styles.heroShell}>
        <HeroSection
          /* The hero as it was on main. The "Open Standard for Generative UI"
             hero with the shuffling outcome line is parked in
             _saved/generative-ui-hero/ for reuse. */
          align="left"
          desktopFromTablet
          subtitle="Open Standard for Generative UI"
          showPlaygroundButton={false}
          showTagline={false}
          commandTrailing={<AgentPicker command={AGENT_SETUP_PROMPT} />}
          /* No GitHub CTA in the hero on either breakpoint: the header carries
             the star count already. Dropping githubRepoUrl takes the desktop
             button; the mobile banner defaults on, so it is turned off here. */
          showGitHubBanner={false}
          /* The Without / With OpenUI demo, streamed live in HTML. Swap the
             example for any config in components/StreamingComparison/examples. */
          desktopPreviewSlot={<ComparisonTabs tabs={COMPARISON_TABS} initial={1} />}
          mobilePreviewSlot={<ComparisonTabs tabs={COMPARISON_TABS} initial={1} />}
          /* TEMP: the live compare demo is back in the hero, as on main.
             To return to the screenshot showcase, set showPreview={false},
             move <LogoStrip /> back down by the tweet wall, restore
             <WhatItDoesSection /> below and the contentSectionTight class. */
        />
        <LogoStrip title="Loved by 50,000+ developers from" />
      </div>
      <div className={styles.contentSection}>
        <div className={styles.contentShell}>
          {/* The open-source band, directly under the logo carousel. */}
          <div className={styles.langBand}>
            <ProductSection {...LANG_PRODUCT} headline={<LangHeadline />} art={<LangShowcase />} />
          </div>

          {/* Fold 2: what it does. TEMP: hidden while the hero demo is back. */}
          {/* <WhatItDoesSection /> */}

          {/* Fold 3: how it works. Hidden for now (the component is kept for
              reuse); its subtitle moved to the integrations fold below. */}
          {/* <HowItWorksSection /> */}

          {/* Fold 4: integrations. */}
          <CompatibilitySection />

          {/* The proof, then the hosted product: fewer tokens and faster
              generation, then reliability in production. */}
          <HeroProof />

          {/* Then who uses OpenUI and what they say. */}
          <div className={styles.cloudGroup}>
            <ShiroPeek />
            <CloudSection />
          </div>
          <TweetWallSection />

          {/* Fold 5: FAQ. */}
          <div className={styles.faqBand} id={BANNER_END_ANCHOR_ID}>
            <FaqSection />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
