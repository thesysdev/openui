import type { ComparisonExample } from "../types";

/* Charts: the Compare demo's ad spend question, as an essay of numbers versus
   KPI figures, monthly spend against revenue, a share donut and a trend.
   Sample data. */

/* The 11 months of 2025 so far, Jan to Nov. */
const MONTHS = Array.from({ length: 11 }, (_, i) => new Date(Date.UTC(2025, i, 1)));

export const AD_SPEND: ComparisonExample = {
  prompt: "Tell me about the correlation between our ad spends and sales",
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Ad Spend vs Sales" },
      {
        type: "paragraph",
        text: "Across all regions in 2025 (YTD), total advertising spend reached $2.4B, driving $9.1B in sales revenue. The overall correlation between advertising spend and sales is strong (R² = 0.72). On average, every additional $1M in advertising spend generated $3.8M in sales.",
      },
      {
        type: "bullets",
        items: [
          "Average campaign spend: $4.2M",
          "Average campaign sales: $16.0M",
          "Top 5% campaigns: Achieved ROIs above 500%",
          "Bottom 5% campaigns: Returned ROIs below 120%",
        ],
      },
      { type: "subheading", text: "North America: Strong & Consistent" },
      {
        type: "paragraph",
        text: "North America's campaigns showed the tightest clustering, with 80% of campaigns delivering sales within ±15% of predicted values. The top outlier campaign spent $8M but brought in $48M in sales, a 6x return.",
      },
      {
        type: "bullets",
        items: [
          "Total spend: $1.05B",
          "Total sales: $4.7B",
          "R²: 0.81 (highest of all regions)",
          "Average ROI: 350%",
        ],
      },
      { type: "subheading", text: "Europe: Moderate but Stable" },
      {
        type: "paragraph",
        text: "European campaigns showed steady returns, though the slope was flatter compared to North America. Mid-spend campaigns ($3–5M) often outperformed both lower and higher spend brackets, indicating diminishing returns beyond the $7M spend range.",
      },
    ],
  },
  right: {
    label: "With OpenUI",
    blocks: [
      { type: "heading", text: "Ad Spend vs Sales" },
      {
        type: "muted",
        text: "Across all regions in 2025 (YTD), every $1 of ad spend returned $2.22 in sales",
      },
      {
        type: "metrics",
        layout: "rules",
        metrics: [
          { value: "$7.30Mn", change: "+4.8%", trend: "up", label: "Total spend" },
          { value: "$16.19Mn", change: "+10.7%", trend: "up", label: "Total sales" },
          { value: "121.8%", label: "Return on investment" },
        ],
      },
      /* Monthly spend and revenue for 2025 so far, in $M: two waves, with
         spend leading revenue by a month. They sum to the $7.30Mn total
         spend and $16.19Mn total sales above. */
      {
        type: "groupedBars",
        title: "Spend vs revenue, 2025",
        categories: MONTHS.map((month) => month.toISOString().slice(0, 7)),
        labels: MONTHS.map((month) =>
          month.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
        ),
        min: 0,
        max: 2.4,
        suffix: "M",
        series: [
          {
            name: "Spend",
            color: "#a5b4fc",
            values: [0.608, 0.74, 0.718, 0.576, 0.454, 0.474, 0.634, 0.814, 0.874, 0.778, 0.63],
          },
          {
            name: "Revenue",
            color: "#4f46e5",
            values: [1.0, 1.35, 1.6, 1.58, 1.34, 1.13, 1.18, 1.48, 1.82, 1.94, 1.77],
          },
        ],
      },
      {
        type: "split",
        /* The donut is square; the trend line gets the extra width. */
        ratio: "minmax(0, 1fr) minmax(0, 1.75fr)",
        columns: [
          [
            {
              type: "donut",
              title: "Share of Global Spend",
              center: { value: "$7.30M", label: "Total spend" },
              slices: [
                { label: "USA", value: 28, color: "#4f46e5" },
                { label: "India", value: 18, color: "#6d72f0" },
                { label: "Canada", value: 14, color: "#93b4f8" },
                { label: "Bulgaria", value: 12, color: "#c7d2fe" },
                { label: "Others", value: 28, color: "#e5e7eb" },
              ],
            },
          ],
          [
            /* Yearly sales in $M, 2015 to 2025 (YTD): from below spend to
               3x, ending on the $16.19Mn total above, 10.7% over 2024. */
            {
              type: "area",
              title: "Sales and spend over time",
              name: "Sales",
              values: [5.4, 5.8, 6.6, 7.5, 8.2, 9.0, 10.1, 11.2, 12.6, 14.63, 16.19],
              /* Yearly ad spend in $M: ahead of sales at first, then growing
                 slowly to the $7.30Mn total spend above, 4.8% over 2024. */
              compare: {
                name: "Spend",
                values: [6.0, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.75, 6.85, 6.966, 7.3],
              },
              labels: ["2015", "2017", "2019", "2021", "2023", "2025"],
              min: 0,
              max: 20,
              yTicks: ["20M", "15M", "10M", "5M", "0"],
              callout: { index: 10, text: "3× since 2015" },
            },
          ],
        ],
      },
    ],
  },
};
