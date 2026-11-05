"use client";

import { ArrowRight, type LucideIcon } from "lucide-react";
import { BevelButton } from "../components/Button/BevelButton";
import landing from "../components/ProductLanding.module.css";
import { StackChip, type StackChipItem } from "../components/StackChip/StackChip";
import { STACK_ROWS } from "../sections/CompatibilitySection/CompatibilitySection";
import styles from "./DashboardIntegration.module.css";
import page from "./page.module.css";

type Step = {
  id: string;
  title: string;
  description: string;
  /* What the step plugs into: logos from the homepage compatibility rows, or
     generic marks where there is no brand to show. */
  marks: { logos?: StackChipItem[]; icons?: LucideIcon[]; names: string };
};

const logos = (items: StackChipItem[]) => ({
  logos: items.slice(0, 4),
  names: items
    .slice(0, 4)
    .map((item) => item.name)
    .join(", "),
});

const STEPS: Step[] = [
  {
    id: "library",
    title: "Register your components",
    description: "Your charts, tables, and filters.",
    marks: logos(STACK_ROWS[2].items.filter((item) => item.iconKind !== "mascot")),
  },
  {
    id: "model",
    title: "Pick a model",
    description: "Hundreds of models through one API.",
    marks: logos(STACK_ROWS[0].items),
  },
  {
    id: "data",
    title: "Connect data and tools",
    description: "Your APIs and databases, your agent’s tools, or an MCP server.",
    marks: logos(STACK_ROWS[1].items),
  },
  {
    id: "render",
    title: "Render the dashboard",
    description: "In chat, a page, a side panel, or mobile.",
    marks: logos(STACK_ROWS[3].items),
  },
];

function Marks({ marks }: { marks: Step["marks"] }) {
  return (
    <span className={styles.marks}>
      <span className={styles.markStack} aria-hidden="true">
        {/* Same rendering as the homepage compatibility clusters. */}
        {marks.logos?.map((item) => (
          <span key={item.name} className={styles.mark}>
            <StackChip item={item} iconOnly plain="fine" />
          </span>
        ))}
        {marks.icons?.map((Icon, index) => (
          <span key={index} className={`${styles.mark} ${styles.markIcon}`}>
            <Icon size={14} strokeWidth={1.75} />
          </span>
        ))}
      </span>
      <span className="sr-only">{marks.names}</span>
    </span>
  );
}

/* The OUI-1 and AppLess how-to band: a title row with the guide button, then
   the numbered steps, five across with a logo row under each. */
export function DashboardIntegration() {
  return (
    <section className={styles.band} aria-labelledby="dashboard-setup-title">
      <div className={page.container}>
        <div className={landing.howHead}>
          <h2 id="dashboard-setup-title" className={landing.howTitle}>
            Add dashboards to your product
          </h2>
          <BevelButton
            href="/docs/dashboards/quickstart"
            variant="secondary"
            label="Read the setup guide"
            badge={<ArrowRight size={16} strokeWidth={2.25} />}
          />
        </div>
        <ol className={styles.row}>
          {STEPS.map((step, index) => (
            <li key={step.id} className={styles.rowStep}>
              <span className={landing.stepBadge}>{index + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepText}>{step.description}</p>
              <Marks marks={step.marks} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
