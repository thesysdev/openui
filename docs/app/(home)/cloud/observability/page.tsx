import type { Metadata } from "next";
import Image from "next/image";
import { ExternalTextLink } from "../../components/ExternalTextLink/ExternalTextLink";
import styles from "../../page.module.css";
import type { GridFeature } from "../../sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "../../sections/Footer/Footer";
import { HeroSection } from "../../sections/HeroSection/HeroSection";
import { EnterpriseSection } from "../EnterpriseSection";
import { CloudCtaSection } from "./CloudCtaSection";
import { EarlyAccessForm } from "./EarlyAccessForm";
import { FaqSection } from "./FaqSection";
import { FeaturesSection } from "./FeaturesSection";
import { IntegrateSection } from "./IntegrateSection";
import cloudStyles from "./page.module.css";
import { WhySection } from "./WhySection";

/* Three rows, not seven. An earlier version walked through capture modes, the
   beforeSend hook and sampling one at a time, which is a docs page wearing a
   marketing page's clothes. What a reader needs here is that it is secure,
   compliant, and that they decide what is sent; the API that makes the third
   one true belongs in the SDK reference. */
const TRUST_ITEMS: GridFeature[] = [
  {
    icon: "key",
    title: "Data controls",
    description: "Keep responses in the browser and capture only the metadata you need.",
  },
  {
    icon: "shield",
    title: "Your data stays yours",
    description:
      "Your data stays private and is never used to train models. Deploy in your VPC or self-host.",
  },
  {
    icon: "database",
    title: "Compliance",
    description: (
      <>
        Find GDPR, SOC 2, and ISO 27001 evidence in the{" "}
        <ExternalTextLink href="https://trust.thesys.dev">Trust centre</ExternalTextLink>.
      </>
    ),
  },
];

export const metadata: Metadata = {
  title: "OpenUI Observability - User analytics for AI agents",
  description: "See what users saw and did, where your agent fell short, and what to build next.",
  alternates: { canonical: "/cloud/observability" },
};

/* A structural copy of the OpenUI Cloud page with its copy and artwork removed.
   Every section component beside this file is a local copy too, so editing one
   here cannot affect /cloud.

   Fill it in a section at a time: each section's copy lives in its own file, and
   the order below is the page order. Sections you decide against can be deleted
   from this list and their file removed.

   LogoStrip is dropped for now; add it back beside the hero if this page wants
   one. */
export default function ObservabilityPage() {
  return (
    <div className={styles.page}>
      <div className={`${styles.heroShell} ${cloudStyles.sectionRhythm}`}>
        <HeroSection
          align="left"
          desktopFromTablet
          title={
            <span className={cloudStyles.titleBlock}>
              {/* The same lockup Cloud uses, with the product name in the tag. */}
              <span className={cloudStyles.eyebrow}>
                OpenUI <span className={cloudStyles.cloudTag}>Observability</span>
              </span>
              {/* The break is real markup but only takes effect on the desktop
                  lockup; the mobile one shares this node and wraps on its own. */}
              <span className={cloudStyles.title}>
                User analytics <br className={cloudStyles.titleBreak} />
                for AI agents
              </span>
            </span>
          }
          subtitle={
            <span className={cloudStyles.subtitle}>
              See what users saw and did, where your agent fell short, and what to build next.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={<EarlyAccessForm />}
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-observability/hero-light.webp"
                alt="OpenUI Observability insights preview"
                width={1280}
                height={600}
                unoptimized
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-observability/hero-dark.webp"
                alt=""
                aria-hidden="true"
                width={1280}
                height={600}
                unoptimized
                priority
              />
            </>
          }
          mobilePreviewSlot={
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-observability/hero-mobile-light.webp"
                alt="OpenUI Observability insights preview"
                width={924}
                height={1040}
                unoptimized
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-observability/hero-mobile-dark.webp"
                alt=""
                aria-hidden="true"
                width={924}
                height={1040}
                unoptimized
                priority
              />
            </>
          }
        />

        {/* Problem, then the features that answer it, then what it costs to adopt
            and what it costs you in data — the Gateway page's spine. */}
        <WhySection />
        <FeaturesSection />
        <IntegrateSection />

        <EnterpriseSection
          titleId="observability-trust"
          title="Secure, compliant, and under your control"
          className={cloudStyles.trustSection}
          features={TRUST_ITEMS}
        />

        <div className={cloudStyles.faqBand}>
          <FaqSection />
        </div>
        <CloudCtaSection />
      </div>
      <Footer />
    </div>
  );
}
