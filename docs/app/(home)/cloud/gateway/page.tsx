import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../../components/Button/BevelButton";
import styles from "../../page.module.css";
import { Footer } from "../../sections/Footer/Footer";
import { HeroSection } from "../../sections/HeroSection/HeroSection";
import { GatewayReliabilityIllustration } from "../../sections/ProductIllustrations/ProductIllustrations";
import { CloudCtaSection } from "../CloudCtaSection";
import { FaqSection } from "./FaqSection";
import { IntegrateSection } from "./IntegrateSection";
import gatewayStyles from "./page.module.css";
import { PricingSection } from "./PricingSection";
import { RepairSection } from "./RepairSection";
import sectionStyles from "./sections.module.css";
import { SecuritySection } from "./SecuritySection";
import { UsageSection } from "./UsageSection";
import { WhySection } from "./WhySection";

export const metadata: Metadata = {
  title: { absolute: "OpenUI Gateway | Production reliability for Generative UI" },
  description:
    "An OpenAI-compatible API that validates model output against your component library and repairs it as it streams.",
  alternates: { canonical: "/cloud/gateway" },
  openGraph: {
    title: "OpenUI Gateway | Production reliability for Generative UI",
    description:
      "Add production reliability to OpenUI with validation, streaming repair, model routing, and provider fallbacks through an OpenAI-compatible API.",
    url: "/cloud/gateway",
    type: "website",
  },
};

export default function GatewayPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          desktopFromTablet
          title={
            <span className={gatewayStyles.titleBlock}>
              <span className={gatewayStyles.eyebrow}>
                OpenUI <span className={gatewayStyles.cloudTag}>Gateway</span>
              </span>
              <span className={gatewayStyles.title}>Production reliability for OpenUI</span>
            </span>
          }
          subtitle={
            <span className={gatewayStyles.subtitle}>
              An OpenAI-compatible API that validates and repairs model output against your
              component library as it streams.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
              <BevelButton
                href="https://console.thesys.dev/keys"
                external
                variant="primary"
                label="Get API key"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href="https://zcal.co/t/thesys/demo"
                external
                variant="secondary"
                label="Book a demo"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={
            <div className={gatewayStyles.heroArtSpace}>
              <GatewayReliabilityIllustration />
            </div>
          }
          mobilePreviewSlot={
            <div className={gatewayStyles.heroArtSpace}>
              <GatewayReliabilityIllustration />
            </div>
          }
        />
      </div>

      <main>
        <div className={gatewayStyles.problemBand}>
          <WhySection />
        </div>
        <div className={gatewayStyles.repairBand}>
          <RepairSection />
        </div>
        <IntegrateSection />
        <div className={gatewayStyles.usageBand}>
          <UsageSection />
        </div>
        <SecuritySection />
        <PricingSection />
        <div className={sectionStyles.faqBand}>
          <FaqSection />
        </div>
        <CloudCtaSection
          title="Run OpenUI in production."
          primary={{
            label: "Get API key",
            href: "https://console.thesys.dev/keys",
            external: true,
          }}
          secondary={{
            label: "Book a demo",
            href: "https://zcal.co/t/thesys/demo",
            external: true,
          }}
        />
      </main>
      <Footer />
    </div>
  );
}
