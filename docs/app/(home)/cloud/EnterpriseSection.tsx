import { ExternalTextLink } from "../components/ExternalTextLink/ExternalTextLink";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import styles from "./EnterpriseSection.module.css";

const ENTERPRISE_FEATURES: GridFeature[] = [
  {
    icon: "shield",
    title: "Enterprise-grade security",
    description: "SOC 2, ISO 27001, and GDPR compliant.",
  },
  {
    icon: "database",
    title: "Zero data retention for training",
    description: "Your data is never used to train models.",
  },
  {
    icon: "cloud",
    title: "Flexible deployment options",
    description: "Choose fully managed cloud or deployment in your own environment.",
  },
  {
    icon: "chart",
    title: "Enterprise observability",
    description:
      "Monitor usage, latency, failures, and rendered output across teams and environments.",
  },
  {
    icon: "pulse",
    title: "Enterprise support & reliability",
    description: "SLAs, proactive monitoring, and 24/7 support.",
  },
  {
    icon: "handshake",
    title: "Hands-on support & co-building",
    description:
      "Work directly with our team to design, build, and launch your production OpenUI experience.",
  },
];

export function EnterpriseSection({
  title = "Built for production-scale enterprise use",
  titleId = "enterprise-section-title",
  features = ENTERPRISE_FEATURES,
  linkLabel = "View trust centre",
  className,
}: {
  title?: string;
  titleId?: string;
  features?: GridFeature[];
  linkLabel?: string;
  className?: string;
} = {}) {
  return (
    <section
      className={[styles.section, className].filter(Boolean).join(" ")}
      aria-labelledby={titleId}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <ExternalTextLink className={styles.link} href="https://trust.thesys.dev/">
          {linkLabel}
        </ExternalTextLink>
      </div>
      <FeatureGridSection
        features={features}
        showHeader={false}
        showCompat={false}
        showBottomSeparator={false}
        flushOuterCards
      />
    </section>
  );
}
