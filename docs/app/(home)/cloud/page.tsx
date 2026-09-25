/* UNREACHABLE. next.config.mjs redirects /cloud to the home page, and a redirect
   wins over a route, so nothing here renders — editing it changes no live page.

   The file is kept, rather than deleted, as the source to mine while the home
   page absorbs the cloud pitch: the section order below is the argument /cloud
   used to make. Delete it, and any section beside it that nothing else imports,
   once that move is finished. CloudFeatureMarquee and CloudCtaSection are NOT
   only used here — the chat upgrade sheet and the benchmarks page import them. */
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection, Tagline } from "../sections/HeroSection/HeroSection";
import { LogoStrip } from "../sections/LogoStrip/LogoStrip";
import { CloudCtaSection } from "./CloudCtaSection";
import { CloudFeatureMarquee } from "./CloudFeatureMarquee";
import { CloudIntegrationSection } from "./CloudIntegrationSection";
import { ComparisonSection } from "./ComparisonSection";
import { EnterpriseSection } from "./EnterpriseSection";
import { FeaturesSection } from "./FeaturesSection";
import cloudStyles from "./page.module.css";

export const metadata: Metadata = {
  title: "OpenUI Cloud - Managed Generative UI Infrastructure",
  description:
    "Build production agent interfaces with managed conversations, generative UI, artifacts, theming, resilience, and observability.",
  alternates: { canonical: "/cloud" },
  openGraph: {
    title: "OpenUI Cloud — Generative UI, ready for production",
    description:
      "The managed backend for production agent interfaces, powered by the open-source OpenUI rendering engine.",
    url: "/cloud",
    type: "website",
    images: [
      {
        url: "/meta-image.png?v=20260725-1708",
        width: 1800,
        height: 942,
        alt: "OpenUI Cloud preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenUI Cloud — Generative UI, ready for production",
    description:
      "The managed backend for production agent interfaces, powered by the open-source OpenUI rendering engine.",
    images: ["/meta-image.png?v=20260725-1708"],
  },
};

export default function OpenUICloudPage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
          align="left"
          title={
            <span className={cloudStyles.titleBlock}>
              <span className={cloudStyles.eyebrow}>
                OpenUI <span className={cloudStyles.cloudTag}>Cloud</span>
              </span>
              <span className={cloudStyles.title}>API for running OpenUI in Production</span>
            </span>
          }
          subtitle={
            <span className={cloudStyles.subtitle}>
              One API for models, fallbacks, validation, rendering, and observability.
            </span>
          }
          smallSubtitle
          tightDesktopSpacing={false}
          splitLockup
          flushInnerInlinePadding
          commandSlot={
            <div className={cloudStyles.ctaGroup}>
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
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-cloud/hero-light.svg"
                alt="OpenUI Cloud production interface preview"
                width={1280}
                height={600}
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-cloud/hero-dark.svg"
                alt=""
                aria-hidden="true"
                width={1280}
                height={600}
                priority
              />
            </>
          }
          mobilePreviewSlot={
            <>
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageLight}`}
                src="/openui-cloud/hero-light.svg"
                alt="OpenUI Cloud production interface preview"
                width={1280}
                height={600}
                priority
              />
              <Image
                className={`${cloudStyles.heroImage} ${cloudStyles.heroImageDark}`}
                src="/openui-cloud/hero-dark.svg"
                alt=""
                aria-hidden="true"
                width={1280}
                height={600}
                priority
              />
            </>
          }
        />
        <LogoStrip variant="cloud" />
        <Tagline>
          <span className={cloudStyles.taglineText}>
            OpenUI Cloud is the managed, production-ready version of OpenUI.
          </span>
          <span className={cloudStyles.taglineNote}>12 reasons why you should upgrade.</span>
        </Tagline>
        <CloudFeatureMarquee />
        <FeaturesSection />
        <CloudIntegrationSection />
        <ComparisonSection />
        <EnterpriseSection />
        <CloudCtaSection />
      </div>
      <Footer />
    </div>
  );
}
