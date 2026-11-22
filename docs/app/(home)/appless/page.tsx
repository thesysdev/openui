import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import { AutofixSection } from "../sections/AutofixSection/AutofixSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { ShiroPeek } from "../sections/ShiroPeek/ShiroPeek";
import { AppLessDemo } from "./AppLessDemo";
import demoStyles from "./AppLessDemo.module.css";
import { AppLessFeatures } from "./AppLessFeatures";
import { AppRail } from "./AppRail";
import { FaqSection } from "./FaqSection";

export const metadata: Metadata = {
  title: "AppLess | What if your phone had no apps?",
  description:
    "Ask for what you need. AppLess creates a native interface for the task, then builds the next screen when you tap.",
  alternates: { canonical: "/appless" },
  openGraph: {
    title: "AppLess | What if your phone had no apps?",
    description: "An open-source experiment in native interfaces generated around your intent.",
    url: "/appless",
    type: "website",
  },
};
const github = "https://github.com/thesysdev/appless";
export default function AppLessPage() {
  const demo = <AppLessDemo />;
  return (
    <div
      className={`${homeStyles.page} ${styles.pageFocus} ${styles.applessPage} ${demoStyles.responsiveHero}`}
    >
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
              <span className={gatewayStyles.eyebrow}>AppLess</span>
              <span className={gatewayStyles.title}>What if your phone had no apps?</span>
            </span>
          }
          subtitle={
            <span className={`${gatewayStyles.subtitle} ${styles.heroSubtitle}`}>
              Ask for what you need. AppLess creates a native interface for the task, then builds
              the next screen when you tap.
            </span>
          }
          commandSlot={
            <div className={`${gatewayStyles.ctaGroup} ${styles.appHeroActions}`}>
              <BevelButton
                href={github}
                external
                variant="primary"
                label="Explore GitHub"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={demo}
          mobilePreviewSlot={demo}
        />
      </div>
      <main>
        <div className={styles.statementBand}>
          <p className={styles.statement}>
            AppLess explores a future where software takes shape around your intent.{" "}
            <span>
              It’s an open-source experiment you can fork, extend, and connect to real services.
            </span>
          </p>
        </div>
        <div className={styles.featuresBand}>
          <div className={styles.featuresInner}>
            <AppLessFeatures />
          </div>
        </div>
        <div className={styles.poweredBanner}>
          {/* Shiro peeks over the banner's top edge, as over the Cloud card on the home page. */}
          <div className={styles.poweredPeek}>
            <ShiroPeek />
          </div>
          <AutofixSection
            actionOnRight
            content={{
              title: <>Powered by OUI-1</>,
              description: (
                <>
                  OUI-1 is a model purpose-built for Generative UI. It generates the interface in
                  OpenUI Lang, and OpenUI renders it into native components as it streams.
                </>
              ),
              action: { label: "Meet OUI-1", href: "/oui-1" },
            }}
          />
        </div>
        <section className={styles.howBand} aria-labelledby="appless-how-title">
          <div className={styles.howInner}>
            <div className={styles.howHead}>
              <h2 id="appless-how-title" className={styles.howTitle}>
                Run AppLess yourself.
              </h2>
              <BevelButton
                href={github + "#quick-start"}
                external
                variant="tertiary"
                label="Read setup docs"
                badge={<ArrowRight size={16} strokeWidth={2.25} />}
              />
            </div>
            <ol className={styles.steps}>
              <li className={styles.step}>
                <span className={styles.stepBadge}>1</span>
                <h3 className={styles.stepTitle}>Get the app</h3>
                <p className={styles.stepDescription}>
                  Clone the{" "}
                  <a
                    className={styles.stepInlineLink}
                    href={github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    repository
                  </a>{" "}
                  and install its dependencies.
                </p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepBadge}>2</span>
                <h3 className={styles.stepTitle}>Start OUI-1</h3>
                <p className={styles.stepDescription}>
                  Serve OUI-1 on your GPU with{" "}
                  <a
                    className={styles.stepInlineLink}
                    href="https://huggingface.co/thesysdev/OUI-1#vllm-recommended"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    vLLM
                  </a>
                  .
                </p>
              </li>
              <li className={styles.step}>
                <span className={styles.stepBadge}>3</span>
                <h3 className={styles.stepTitle}>Launch and ask</h3>
                <p className={styles.stepDescription}>
                  Set your{" "}
                  <a
                    className={styles.stepInlineLink}
                    href={github + "#quick-start"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    server address
                  </a>
                  , launch on iOS or Android, and ask for a screen.
                </p>
              </li>
            </ol>
          </div>
        </section>
        <div className={styles.productFaqBand}>
          <FaqSection />
        </div>
        <div className={`${styles.statementBand} ${styles.closingBand}`}>
          <h2 className={`${styles.statement} ${styles.statementLarge}`}>
            No apps. Just intent → interface.
          </h2>
          <AppRail />
          <p className={styles.statementLead}>
            No apps to install. No menus to learn. No screen cluttered with countless app icons.
          </p>
          <div className={`${gatewayStyles.ctaGroup} ${styles.statementActions}`}>
            <BevelButton
              href={github}
              external
              variant="primary"
              label="Explore GitHub"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
            <BevelButton
              href={github + "#quick-start"}
              external
              variant="secondary"
              label="Read the setup guide"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
