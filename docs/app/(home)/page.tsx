import type { Metadata } from "next";
import { AGENT_SETUP_PROMPT, AgentPicker } from "./components/AgentPicker/AgentPicker";
import styles from "./page.module.css";
import { CloudBanner } from "./sections/CloudBanner/CloudBanner";
import { CloudSection } from "./sections/CloudSection/CloudSection";
import { FaqSection } from "./sections/FaqSection/FaqSection";
import { FeatureGridSection } from "./sections/FeatureGridSection/FeatureGridSection";
import { Footer } from "./sections/Footer/Footer";
import { HeroSection } from "./sections/HeroSection/HeroSection";
import { LogoStrip } from "./sections/LogoStrip/LogoStrip";
import { OpenSourceIllustration } from "./sections/ProductIllustrations/ProductIllustrations";
import { ProductSection } from "./sections/ProductSection/ProductSection";
import { LANG_PRODUCT } from "./sections/ProductSection/products";
import { ShiroPeek } from "./sections/ShiroPeek/ShiroPeek";
import { TweetWallSection } from "./sections/TweetWallSection/TweetWallSection";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.heroShell}>
        <HeroSection
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
        />
        <LogoStrip />
        {/* Tagline hidden for now; restore this line to bring it back. */}
      </div>
      {/* The open-source band opens the solid page field. */}
      <div className={styles.contentSection}>
        <div className={styles.contentShell}>
          <div className={styles.langBand}>
            <ProductSection {...LANG_PRODUCT} art={<OpenSourceIllustration />} fullBleedArt />
          </div>
          {/* The benchmark header and the compatibility band, without the feature
              grid that used to sit between them. */}
          {/* No compatFirst: the benchmark claim leads and the compatibility band
              follows it, so the page proves the point before saying what it
              works with. The grid runs on its own six features — Live data and
              Cross-platform are only stated here. */}
          <FeatureGridSection gridFirst showHeaderSeparator={false} showBottomSeparator={false} />

          <div className={styles.cloudGroup}>
            <ShiroPeek />
            <CloudSection />
          </div>
          <TweetWallSection />
          <div className={styles.faqBand}>
            <FaqSection />
          </div>
        </div>
      </div>
      <Footer />
      <CloudBanner />
    </div>
  );
}
