import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { BevelButton } from "../../components/Button/BevelButton";
import styles from "./AutofixSection.module.css";

export function AutofixSection({
  tone = "page",
  headingLevel = "h2",
}: {
  tone?: "page" | "cloud";
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <section className={`${styles.section} ${tone === "cloud" ? styles.cloud : ""}`.trim()}>
      <div className={styles.banner}>
        <div className={styles.copy}>
          <Heading className={styles.title}>
            <span className={styles.titleLine}>Keep your existing model provider,</span>
            <span className={styles.titleLine}>Add reliability with Autofix.</span>
          </Heading>
          <p className={styles.description}>
            One Autofix API call repairs invalid output before it reaches your users. Keep your
            provider and model calls.
          </p>
          <BevelButton
            className={styles.cta}
            variant="secondary"
            href="/docs/gateway/api/autofix"
            label="View docs"
            badge={<ArrowRight size={16} weight="bold" />}
          />
        </div>

        <div
          className={styles.visual}
          role="img"
          aria-label="Invalid generated output corrected into valid UI by Autofix"
        >
          <div className={styles.illustration} aria-hidden="true">
            <Image
              className={`${styles.illustrationImage} ${styles.illustrationImageLight}`}
              src="/images/gateway/autofix-illustration-light.webp"
              alt=""
              width={1940}
              height={636}
              unoptimized
            />
            <Image
              className={`${styles.illustrationImage} ${styles.illustrationImageDark}`}
              src="/images/gateway/autofix-illustration-dark.webp"
              alt=""
              width={1940}
              height={636}
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
