import type { ComparisonExample } from "../types";

/* Dashboards: the plain-text answer against the Sales pipeline dashboard
   from the Dashboards page hero, with its KPIs, stage funnel, bookings bars
   and rep leaderboard. Sample data, matching the hero scene's numbers. */
export const SALES_DASHBOARD: ComparisonExample = {
  prompt: "Make a sales pipeline dashboard for this quarter",
  leftOnPhonesOnly: true,
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Sales pipeline, this quarter" },
      {
        type: "paragraph",
        text: "Here's where the pipeline stands this quarter. Total pipeline reached $7.0M, up 12% on last quarter, across 219 open deals with a 28% win rate and a $32.1K average deal.",
      },
      {
        type: "bullets",
        items: [
          "Pipeline: $7.0M (+12%)",
          "Open deals: 219 (+6.1%)",
          "Win rate: 28% (+2.4%)",
          "Average deal: $32.1K (−1.2%)",
        ],
      },
      { type: "subheading", text: "Pipeline by stage" },
      {
        type: "paragraph",
        text: "Prospecting holds $3.0M, qualified deals $2.0M, proposals $1.3M, and negotiation $0.7M. Bookings for the year are tracking to $1.53M, up 9.4% on forecast.",
      },
      { type: "subheading", text: "Top reps" },
      {
        type: "bullets",
        items: [
          "Maya Chen: $1.68M pipeline, 24% share",
          "Leo Park: $1.47M pipeline, 21% share",
          "Ana Ruiz: $1.05M pipeline, 15% share",
          "Sam Patel: $0.77M pipeline, 11% share",
        ],
      },
    ],
  },
  right: {
    label: "With OpenUI",
    sectioned: true,
    blocks: [
      { type: "heading", text: "Sales pipeline" },
      {
        type: "muted",
        text: "Pipeline stands at $7.0M this quarter, up 12% across 219 open deals",
      },
      {
        type: "metrics",
        layout: "rules",
        metrics: [
          { value: "$7.0M", label: "Pipeline" },
          { value: "219", label: "Open deals" },
          { value: "28%", label: "Win rate" },
          { value: "$32.1K", label: "Average deal" },
        ],
      },
      {
        type: "split",
        ratio: "1.7fr 1fr",
        columns: [
          [
            {
              type: "barChart",
              title: "Bookings · Forecast",
              unit: "K",
              bars: [
                { label: "D", value: 96 },
                { label: "J", value: 104 },
                { label: "F", value: 99 },
                { label: "M", value: 112 },
                { label: "A", value: 118 },
                { label: "M", value: 109 },
                { label: "J", value: 121 },
                { label: "J", value: 127 },
                { label: "A", value: 124 },
                { label: "S", value: 131 },
                { label: "O", value: 141 },
                { label: "N", value: 153 },
              ],
            },
          ],
          [
            {
              type: "funnel",
              title: "Pipeline by stage",
              steps: [
                { label: "Prospecting", value: 3000000, display: "$3.0M", color: "#4f46e5" },
                { label: "Qualified", value: 2000000, display: "$2.0M", color: "#6d72f0" },
                { label: "Proposal", value: 1300000, display: "$1.3M", color: "#93b4f8" },
                { label: "Negotiation", value: 700000, display: "$0.7M", color: "#c7d2fe" },
              ],
            },
          ],
        ],
      },
      { type: "subheading", text: "Top reps this quarter" },
      {
        type: "table",
        columns: ["Rep", "Open deals", "Pipeline", "Share"],
        rows: [
          [
            { text: "Maya Chen", strong: true },
            "52",
            { text: "$1.68M", bar: 1 },
            { text: "24%", badge: "green" },
          ],
          [
            { text: "Leo Park", strong: true },
            "47",
            { text: "$1.47M", bar: 0.88 },
            { text: "21%", badge: "green" },
          ],
          [
            { text: "Ana Ruiz", strong: true },
            "34",
            { text: "$1.05M", bar: 0.63 },
            { text: "15%", badge: "blue" },
          ],
          [
            { text: "Sam Patel", strong: true },
            "26",
            { text: "$0.77M", bar: 0.46 },
            { text: "11%", badge: "amber" },
          ],
        ],
      },
    ],
  },
};
