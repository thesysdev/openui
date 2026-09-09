import { CloudFeatureCard } from "../FeaturesSection";
import cloudStyles from "../FeaturesSection.module.css";
import styles from "./sections.module.css";

export function UsageSection() {
  return (
    <section
      className={`${cloudStyles.section} ${styles.usageSection}`}
      aria-label="Gateway usage, cost, and correction reporting"
    >
      <CloudFeatureCard
        image="/images/gateway/usage-light.webp"
        imageDark="/images/gateway/usage-dark.webp"
        imageAlt="Gateway activity dashboard showing requests, token volume, estimated cost, and usage by model"
        title="Usage, cost, and corrections"
        headline="in a single view"
        description="See where model spend goes, what reaches users, and how often Gateway fixes invalid output before users see it."
        unoptimized
      />
    </section>
  );
}
