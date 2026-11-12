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
import styles from "./page.module.css";

/* Each card's illustration, by feature id. */
const ILLUSTRATIONS: Record<string, ReactNode> = {
  models: <ModelsIllustration />,
  interactive: <InteractiveIllustration />,
  agent: <AgentIllustration />,
  validation: <ValidatedIllustration />,
  safety: <SafetyIllustration />,
};

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
        {/* The OUI-1 and AppLess feature lockup: a centered line and its lead. */}
        <h2 id="dashboard-features-title" className={landing.statement}>
          Fits your stack,
          <br className={styles.phoneBreak} /> holds up in production{" "}
          <span>
            Use any model and your existing agent. Bad output gets repaired, and only your
            components and tools run.
          </span>
        </h2>
        <div className={styles.features}>
          <IllustratedFeatures>
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
