import type { ComparisonExample } from "../types";
import { FinanceScene } from "./FinanceScene";

/* Dashboards: the plain-text answer against the Finance board from the
   Dashboards page hero. The text tells only what the board shows, with the
   board's own numbers. */
export const FINANCE_DASHBOARD: ComparisonExample = {
  prompt: "Make a finance dashboard for the Q4 budget",
  leftOnPhonesOnly: true,
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Q4 budget overview" },
      {
        type: "paragraph",
        text: "Here's where the Q4 budget stands. Revenue reached $1.26M quarter to date, up 8.1%, while operating spend of $822K is running 4.0% under budget. Gross margin improved to 62.7%, up 1.2 points on Q3, and runway extended to 23 months at the current burn.",
      },
      {
        type: "bullets",
        items: [
          "Revenue: $1.26M (+8.1% quarter to date)",
          "Operating spend: $822K (4.0% under budget)",
          "Gross margin: 62.7% (+1.2 pt on Q3)",
          "Runway: 23 months (+2 months)",
        ],
      },
      { type: "subheading", text: "Cash flow" },
      {
        type: "paragraph",
        text: "Cash in ran ahead of cash out every week from August through November, so the quarter stayed cash-flow positive throughout.",
      },
      { type: "subheading", text: "Budget vs actual" },
      {
        type: "bullets",
        items: [
          "Engineering: $414K of a $430K budget",
          "Sales: $245K of a $252K budget",
          "Marketing: $163K of a $176K budget",
        ],
      },
      { type: "subheading", text: "Recent invoices" },
      {
        type: "bullets",
        items: [
          "Vercel: $84.2K, due Nov 14, paid",
          "Snowflake: $36.8K, due Nov 18, scheduled",
          "Figma: $9.4K, due Nov 21, overdue",
          "Datadog: $21.6K, due Nov 28, paid",
        ],
      },
    ],
  },
  /* The real board from the Dashboards hero, not a rebuild: it carries its
     own title, KPIs, charts and invoices, and animates itself in. */
  right: {
    label: "With OpenUI",
    bare: true,
    blocks: [{ type: "custom", node: <FinanceScene /> }],
  },
};
