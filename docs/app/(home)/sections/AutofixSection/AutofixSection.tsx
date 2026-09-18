import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
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
            <span className={styles.titleLine}>Already have a model stack?</span>
            <span className={styles.titleLine}>Add the repair layer.</span>
          </Heading>
          <p className={styles.description}>
            Autofix fixes invalid generations before users see them,
            <span className={styles.descriptionLine}>with one API call.</span>
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
          <span className={styles.illustration} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
