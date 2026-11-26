import type { ReactNode } from "react";
import {
  IllustratedFeature,
  IllustratedFeatures,
} from "../components/IllustratedFeatures/IllustratedFeatures";
import landing from "../components/ProductLanding.module.css";
import {
  InteractiveIllustration,
  SafetyIllustration,
  ValidatedIllustration,
} from "./FeatureIllustrations";
import { SharingIllustration, SourcesIllustration } from "./LaunchIllustrations";
import styles from "./page.module.css";

/* The launch pair leads, as halves on the shader stage. */
const LAUNCH: { title: string; description: string; art: ReactNode }[] = [
  {
    title: "Share and edit",
    description: "Your users can share a dashboard and edit it together.",
    art: <SharingIllustration />,
  },
  {
    title: "See the sources",
    description: "Users watch it build, then see where each chart's data comes from.",
    art: <SourcesIllustration />,
  },
];

/* Then three thirds on a flat stage. Models, and how it fits your agent, have
   their own section below. */
const THIRDS: { title: string; description: string; art: ReactNode }[] = [
  {
    title: "Interactive by default",
    description: "Users filter and drill down into the data without another prompt.",
    art: <InteractiveIllustration />,
  },
  {
    title: "Validated output",
    description: "Invalid output is caught and repaired before it reaches your users.",
    art: <ValidatedIllustration />,
  },
  {
    title: "Safe by design",
    description: "Only your components render, and only your tools get called.",
    art: <SafetyIllustration />,
  },
];

export function DashboardFeatures() {
  return (
    <section
      className={`${styles.section} ${styles.sectionWide}`}
      aria-labelledby="dashboard-features-title"
    >
      <div className={styles.container}>
        <h2 id="dashboard-features-title" className={landing.statement}>
          Dashboards users can share and inspect{" "}
          <span>
            Build with your existing agent, your data tools, and the components your users know.
          </span>
        </h2>
        <div className={styles.features}>
          <IllustratedFeatures>
            {LAUNCH.map((feature) => (
              <IllustratedFeature
                key={feature.title}
                span="half"
                title={feature.title}
                description={feature.description}
              >
                {feature.art}
              </IllustratedFeature>
            ))}
            {THIRDS.map((feature) => (
              <IllustratedFeature
                key={feature.title}
                span="third"
                shader={false}
                title={feature.title}
                description={feature.description}
              >
                {feature.art}
              </IllustratedFeature>
            ))}
          </IllustratedFeatures>
        </div>
      </div>
    </section>
  );
}
