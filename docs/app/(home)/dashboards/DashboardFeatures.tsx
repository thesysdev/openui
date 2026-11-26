import type { ReactNode } from "react";
import {
  IllustratedFeature,
  IllustratedFeatures,
} from "../components/IllustratedFeatures/IllustratedFeatures";
import landing from "../components/ProductLanding.module.css";
import {
  AgentIllustration,
  InteractiveIllustration,
  ModelsIllustration,
  SafetyIllustration,
  ValidatedIllustration,
} from "./FeatureIllustrations";
import { SharingIllustration, SourcesIllustration } from "./LaunchIllustrations";
import styles from "./page.module.css";

/* Each card's illustration, by feature id. */
const ILLUSTRATIONS: Record<string, ReactNode> = {
  models: <ModelsIllustration />,
  interactive: <InteractiveIllustration />,
  agent: <AgentIllustration />,
  validation: <ValidatedIllustration />,
  safety: <SafetyIllustration />,
};

const LAUNCH_FEATURES = [
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

/* The OUI-1 feature grid: two halves on the shader stage, three thirds on a
   flat stage. */
const HALVES = [
  {
    id: "models",
    title: "Hundreds of models",
    description: "Use models from OpenAI, Anthropic, Google, and more through one API.",
  },
  {
    id: "interactive",
    title: "Interactive by default",
    description: "Users filter and drill down into the data without another prompt.",
  },
];

const THIRDS = [
  {
    id: "agent",
    title: "Works with your agent",
    description: "Keep your agent framework and tools. Change only how you render.",
  },
  {
    id: "validation",
    title: "Validated output",
    description: "Invalid output is caught and repaired before it reaches your users.",
  },
  {
    id: "safety",
    title: "Safe by design",
    description: "Only your components render, and only your tools get called.",
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
            {LAUNCH_FEATURES.map((feature) => (
              <IllustratedFeature
                key={feature.title}
                span="half"
                title={feature.title}
                description={feature.description}
              >
                {feature.art}
              </IllustratedFeature>
            ))}
            {HALVES.map((feature) => (
              <IllustratedFeature
                key={feature.id}
                span="half"
                title={feature.title}
                description={feature.description}
              >
                {ILLUSTRATIONS[feature.id]}
              </IllustratedFeature>
            ))}
            {THIRDS.map((feature) => (
              <IllustratedFeature
                key={feature.id}
                span="third"
                shader={false}
                title={feature.title}
                description={feature.description}
              >
                {ILLUSTRATIONS[feature.id]}
              </IllustratedFeature>
            ))}
          </IllustratedFeatures>
        </div>
      </div>
    </section>
  );
}
