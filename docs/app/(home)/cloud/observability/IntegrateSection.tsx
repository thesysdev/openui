import { CloudIntegrationSetup, type CloudIntegrationStep } from "../CloudIntegrationSection";
import styles from "./page.module.css";

/* Both steps stay open beside the final two-line setup. Verified against
   packages/observability-cloud: the package name, `init`, and the `pk-th-…`
   key format all come from
   CloudObservabilityOptions rather than from the brief, which named the package
   two different ways. */
const OBSERVABILITY_EXAMPLE = `// src/main.tsx
import { createRoot } from "react-dom/client";
import { App } from "./App";
import * as Observability from "@openuidev/observability-cloud";

Observability.init({ apiKey: "pk-th-…" });

const root = document.getElementById("root");
createRoot(root!).render(<App />);`;

const STEPS: CloudIntegrationStep[] = [
  {
    title: "Generate a frontend API key",
    description:
      "Create a publishable key in the OpenUI console. It’s safe to use in browser code.",
    href: "https://console.thesys.dev/client-api-keys",
  },
  {
    title: "Initialize the SDK",
    description: "Add it once at your app entry point. No tracking code needed in your components.",
  },
];

export function IntegrateSection() {
  return (
    <section className={styles.integrationSection} aria-labelledby="observability-integrate">
      <CloudIntegrationSetup
        title="Set up in two lines"
        titleId="observability-integrate"
        description="Keep your agent framework and backend. The SDK captures events OpenUI already emits as it renders."
        steps={STEPS}
        code={OBSERVABILITY_EXAMPLE}
        highlightLines={[3, 5]}
        dimUnchanged
        codeLabel="OpenUI Observability client configuration"
        titleSize="medium"
      />
    </section>
  );
}
