import { ArrowUpRight } from "lucide-react";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "./OpenDashboardsCard.module.css";
import { OpenDashboardsScreen } from "./OpenDashboardsScreen";

const OPENDASHBOARDS_URL = "https://opendashboards.com";

const STEPS = [
  "Connect your data and tools",
  "Ask for a dashboard in plain words",
  "Share it with your team",
];

/* The hosted, ready-to-use build of OpenUI Dashboards, offered right under the
   logo strip for visitors who want to try it before wiring up their own. The
   app's own screen sits on the left; the button is the only link and
   stretches over the card, so the whole card clicks through without nesting
   anchors. */
export function OpenDashboardsCard() {
  return (
    <div className={styles.card}>
      <div className={styles.media}>
        <div className={styles.frame}>
          <OpenDashboardsScreen />
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.copy}>
          <span className={styles.chip}>App</span>
          <p className={styles.title}>Open Dashboards</p>
          <p className={styles.description}>
            Open-source Claude dashboards. Use it free, or host it yourself.
          </p>
          <ol className={styles.steps}>
            {STEPS.map((step, i) => (
              <li key={step} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <BevelButton
          href={OPENDASHBOARDS_URL}
          external
          variant="primary"
          label="Try for free"
          badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
          className={styles.cta}
        />
      </div>
    </div>
  );
}
