"use client";

import landing from "../components/ProductLanding.module.css";
import { stackChipStyles, type StackChipItem } from "../components/StackChip/StackChip";
import {
  CompatibilityCards,
  STACK_ROWS,
  type StackRow,
} from "../sections/CompatibilitySection/CompatibilitySection";
import styles from "./page.module.css";

/* A brand's mark in its own colour on the white badge. */
const onWhite = `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`;
const mark = (name: string, slug: string, iconColor: string): StackChipItem => ({
  name,
  iconKind: "image",
  slug,
  iconColor,
  badgeClassName: onWhite,
});
const fromHome = (row: number, names: string[]) =>
  STACK_ROWS[row].items.filter((item) => names.includes(item.name));

/* What dashboards work with, group by group, in the homepage's card format. The models come with
   the API: OpenUI Gateway serves hundreds (OpenAI, Anthropic and Google directly, the rest through
   OpenRouter), picked by id in defineDashboard, and an OpenAI, Anthropic or Google key can be
   brought along (BYOK). So every card says "any", not "your". Agents add three tools (create, edit
   and read a dashboard), so any agent that calls tools works; the docs show the OpenAI SDK and the
   Vercel AI SDK. Data comes through your own data tools or MCP servers, and the components are the
   dashboard library or your design system's. */
const DASHBOARD_ROWS: StackRow[] = [
  {
    label: "LLMs",
    title: "Any model",
    description:
      "Hundreds of models built into the API. Or bring your own OpenAI, Anthropic or Google key.",
    items: [
      ...fromHome(0, ["OpenAI", "Anthropic", "Gemini"]),
      mark("Meta", "meta", "0467df"),
      ...fromHome(0, ["DeepSeek", "xAI", "Mistral", "Qwen"]),
    ],
  },
  {
    label: "Agents",
    title: "Any agent",
    description: "If it calls tools, it works. Add three: create, edit and read.",
    // Led by the Vercel AI SDK, so this card doesn't open on the same mark as the model card.
    items: [
      ...fromHome(1, ["Vercel AI SDK"]),
      {
        name: "OpenAI SDK",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: onWhite,
      },
      ...fromHome(1, ["LangChain", "LangGraph", "Cloudflare", "Convex"]),
    ],
  },
  {
    label: "Data",
    title: "Any data source",
    description: "Your APIs and databases through your own tools, and any MCP server.",
    items: [
      {
        name: "MCP",
        iconKind: "image",
        slug: "modelcontextprotocol",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      mark("PostgreSQL", "postgresql", "4169e1"),
      mark("PostHog", "posthog", "000000"),
      mark("Stripe", "stripe", "635bff"),
      mark("BigQuery", "googlebigquery", "4285f4"),
      mark("Snowflake", "snowflake", "29b5e8"),
      mark("Supabase", "supabase", "3ecf8e"),
      {
        name: "ClickHouse",
        iconKind: "image",
        slug: "clickhouse",
        iconColor: "faff69",
        badgeClassName: stackChipStyles.badgeBlack,
      },
    ],
  },
  {
    label: "UI library",
    title: "Any design system",
    description: "The prebuilt dashboard library, or your own components.",
    items: STACK_ROWS[2].items,
  },
];

/* The homepage's compatibility panel under this page's own heading and spacing, so it reads as
   the next section after the feature grid. */
export function DashboardStack() {
  return (
    <section
      className={`${styles.section} ${styles.sectionWide}`}
      aria-labelledby="dashboard-stack-title"
    >
      <div className={styles.container}>
        <h2 id="dashboard-stack-title" className={landing.statement}>
          Works with the agent you already have{" "}
          <span>Add three dashboard tools. Everything else stays as it is.</span>
        </h2>
        <div className={`${styles.features} ${styles.stack}`}>
          <CompatibilityCards rows={DASHBOARD_ROWS} />
        </div>
      </div>
    </section>
  );
}
