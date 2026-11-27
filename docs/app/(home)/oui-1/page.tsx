import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import { FadedDither } from "../components/FadedDither/FadedDither";
import styles from "../components/ProductLanding.module.css";
import homeStyles from "../page.module.css";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import { FaqSection } from "./FaqSection";
import { OuiFeatures } from "./OuiFeatures";

export const metadata: Metadata = {
  title: "OUI-1 | An open model built for Generative UI",
  description:
    "A DiffusionGemma finetune that writes OpenUI Lang, with 4B active parameters, a 71.7% Generative UI Benchmark score, and Apache 2.0 weights.",
  alternates: { canonical: "/oui-1" },
  openGraph: {
    title: "OUI-1 | An open model built for Generative UI",
    description:
      "Generate interfaces from your components with an open-weight model built for OpenUI Lang.",
    url: "/oui-1",
    type: "website",
  },
};
const model = "https://huggingface.co/thesysdev/OUI-1";
const research = "/blog/oui-1";
const guide = "/docs/build-agents/ui-generation";
const steps = [
  {
    title: "Run OUI-1",
    description: "Serve OUI-1 on your GPU with ",
    descriptionEnd: ".",
    link: model + "#vllm-recommended",
    linkLabel: "vLLM",
    external: true,
  },
  {
    title: "Define your components",
    description: "Define your ",
    descriptionEnd: ", then generate its system prompt.",
    link: "/docs/openui-lang/defining-components",
    linkLabel: "component library",
    external: false,
  },
  {
    title: "Render the interface",
    description: "Send a request to OUI-1 and stream its response into the ",
    descriptionEnd: ".",
    link: "/docs/openui-lang/renderer",
    linkLabel: "Renderer",
    external: false,
  },
];
/* One half of a laurel: leaf pairs set along an arc, outer and inner. */
function LaurelBranch({ mirrored }: { mirrored?: boolean }) {
  const CX = 44;
  const CY = 30;
  const R = 30;
  const nodes = [122, 142, 162, 182, 202, 222];
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
  };
  const [x0, y0] = point(112);
  const [x1, y1] = point(232);
  return (
    <svg
      aria-hidden="true"
      className={styles.laurel}
      width="36"
      height="64"
      viewBox="0 0 36 64"
      style={mirrored ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        className={styles.laurelStem}
        d={`M${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`}
      />
      {nodes.flatMap((deg) => {
        const [x, y] = point(deg);
        // lean each leaf off the stem's tangent: one outward, one inward
        return [deg + 50, deg + 130].map((turn) => (
          <path
            key={`${deg}-${turn}`}
            d="M0 0C3 -3 8 -3 11 0C8 3 3 3 0 0Z"
            transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${turn})`}
          />
        ));
      })}
    </svg>
  );
}

export default function OuiOnePage() {
  const artwork = (
    <div className={`${gatewayStyles.heroArtSpace} ${styles.ouiArtStage}`}>
      <FadedDither band="light" className={gatewayStyles.heroShader} />
      <div className={gatewayStyles.heroArtwork}>
        <iframe
          src="/oui-1/hero.html"
          title="The same question answered two ways: a wall of streamed text without OpenUI, and a rendered health dashboard with it"
          className={styles.ouiArtFrame}
          scrolling="no"
        />
      </div>
    </div>
  );
  return (
    <div className={`${homeStyles.page} ${styles.pageFocus} ${styles.ouiPage}`}>
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
                OpenUI <span className={gatewayStyles.cloudTag}>OUI-1</span>
              </span>
              <span className={gatewayStyles.title}>An open model built for Generative UI</span>
            </span>
          }
          subtitle={
            <span className={`${gatewayStyles.subtitle} ${styles.heroSubtitle}`}>
              Generate interfaces from your own components.{" "}
              <span className={styles.noWrap}>OUI-1</span> writes{" "}
              <span className={styles.noWrap}>OpenUI Lang,</span> ready to render as it streams.
            </span>
          }
          commandSlot={
            <div className={gatewayStyles.ctaGroup}>
              <BevelButton
                href={model}
                external
                variant="primary"
                label="Get the model"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
              <BevelButton
                href={research}
                variant="secondary"
                label="Read the research"
                badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
              />
            </div>
          }
          showPlaygroundButton={false}
          showGitHubBanner={false}
          showTagline={false}
          desktopPreviewSlot={artwork}
          mobilePreviewSlot={artwork}
        />
      </div>
      <main>
        <div className={styles.statementBand}>
          <p className={styles.statement}>
            General-purpose models are built for text.
            <br className={styles.statementBreak} /> OUI-1 is purpose-built for interfaces.{" "}
            <span>
              It transforms natural language into fast, reliable, interactive interfaces using your
              own components.
            </span>
          </p>
        </div>
        <div className={styles.featuresBand}>
          <div className={styles.featuresInner}>
            <OuiFeatures />
          </div>
        </div>
        <section className={styles.howBand} aria-labelledby="oui-how-title">
          <div className={styles.howInner}>
            <div className={styles.howHead}>
              <h2 id="oui-how-title" className={styles.howTitle}>
                Build with OUI-1.
              </h2>
              <BevelButton
                href={guide}
                variant="tertiary"
                label="Read setup docs"
                badge={<ArrowRight size={16} strokeWidth={2.25} />}
              />
            </div>
            <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepBadge}>{index + 1}</span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>
                    {step.description}
                    <a
                      href={step.link}
                      className={styles.stepInlineLink}
                      {...(step.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {step.linkLabel}
                    </a>
                    {step.descriptionEnd}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <div className={styles.productFaqBand}>
          <FaqSection />
        </div>
        <div className={`${styles.statementBand} ${styles.closingBand}`}>
          <div className={styles.openBadge}>
            <LaurelBranch />
            <span className={styles.openLabel}>Open-Source</span>
            <LaurelBranch mirrored />
          </div>
          <h2 className={`${styles.statement} ${styles.statementLarge}`}>
            Open weights, Apache 2.0
          </h2>
          <p className={styles.statementLead}>
            Download, customize, fine-tune, and deploy OUI-1 on your own infrastructure. Built for
            everyone, with no vendor lock-in.
          </p>
          <div className={`${gatewayStyles.ctaGroup} ${styles.statementActions}`}>
            <BevelButton
              href={model}
              external
              variant="primary"
              label="Get the model"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
            <BevelButton
              href={research}
              variant="secondary"
              label="Read the research"
              badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
