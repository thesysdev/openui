import { Globe, Landmark, MountainSnow } from "lucide-react";
import type { ComparisonExample } from "../types";

/* Dashboards: the plain-text answer against a yearly performance overview
   with KPIs, a spend-vs-sales scatter and a campaign table. Sample data. */
export const SALES_DASHBOARD: ComparisonExample = {
  prompt: "Make a performance overview dashboard for this year",
  leftOnPhonesOnly: true,
  left: {
    label: "Without",
    follow: true,
    blocks: [
      { type: "heading", text: "Performance overview, 2025" },
      {
        type: "paragraph",
        text: "Here is a performance overview for the year so far. Across all regions in 2025 (YTD), total advertising spend reached $110.4M, generating $425.5M in sales at an average ROI of 342% across 12 active campaigns.",
      },
      {
        type: "bullets",
        items: [
          "Total ad spends: $110.42M",
          "Total sales: $425.5M",
          "Average ROI: 342%",
          "Active campaigns: 12",
        ],
      },
      { type: "subheading", text: "Spend vs sales" },
      {
        type: "paragraph",
        text: "Sales track spend closely across markets. North America shows the tightest clustering, Europe delivers steady mid-range returns, and Asia trails on volume but leads on efficiency for campaigns under $5M.",
      },
      { type: "subheading", text: "Regional snapshot" },
      {
        type: "bullets",
        items: [
          "NA-01 · North America: $48.0M spend, $299.0M sales, 523% ROI",
          "EU-02 · Europe: $36.5M spend, $172.4M sales, 372% ROI",
          "AS-03 · Asia: $25.9M spend, $98.1M sales, 279% ROI",
        ],
      },
    ],
  },
  right: {
    label: "With OpenUI",
    sectioned: true,
    blocks: [
      { type: "heading", text: "Performance overview" },
      {
        type: "muted",
        text: "Across all regions in 2025 (YTD), total advertising spend reached $2.4B",
      },
      {
        type: "metrics",
        layout: "rules",
        metrics: [
          { value: "$110.42Mn", label: "Total Ad spends" },
          { value: "$425.5Mn", label: "Total sales" },
          { value: "342%", label: "Average ROI%" },
          { value: "12", label: "Active campaigns" },
        ],
      },
      {
        type: "split",
        ratio: "1.7fr 1fr",
        columns: [
          [
            {
              type: "scatter",
              title: "Ad spends vs Sales",
              yTicks: ["7M", "6M", "5M", "4M", "3M", "2M"],
              xTicks: ["100K", "500K", "1M", "1.5M", "2M"],
              series: [
                {
                  name: "North America",
                  color: "#4f46e5",
                  points: [
                    [12, 38],
                    [22, 46],
                    [34, 55],
                    [46, 62],
                    [58, 70],
                    [70, 78],
                    [82, 84],
                    [92, 90],
                  ],
                },
                {
                  name: "Europe",
                  color: "#93b4f8",
                  points: [
                    [8, 24],
                    [18, 30],
                    [30, 36],
                    [42, 44],
                    [54, 47],
                    [66, 52],
                    [78, 55],
                    [90, 58],
                  ],
                },
                {
                  name: "Asia",
                  color: "#f59e0b",
                  points: [
                    [6, 14],
                    [16, 20],
                    [28, 18],
                    [40, 28],
                    [52, 33],
                    [64, 30],
                    [76, 40],
                    [88, 44],
                  ],
                },
              ],
            },
          ],
          [
            {
              type: "funnel",
              title: "Campaign funnel",
              steps: [
                { label: "Impressions", value: 4200000, display: "4.2M", color: "#4f46e5" },
                { label: "Clicks", value: 310000, display: "310K", color: "#6d72f0" },
                { label: "Sign-ups", value: 42000, display: "42K", color: "#93b4f8" },
                { label: "Purchases", value: 9800, display: "9.8K", color: "#c7d2fe" },
              ],
            },
          ],
        ],
      },
      { type: "subheading", text: "Regional campaign snapshot" },
      {
        type: "table",
        columns: ["Campaign ID", "Region", "Ad Spends", "Sales", "ROI %"],
        rows: [
          [
            { text: "NA-01", strong: true },
            { text: "North America", icon: <Globe aria-hidden /> },
            "$48.0Mn",
            { text: "$299.0Mn", bar: 1 },
            { text: "523%", badge: "green" },
          ],
          [
            { text: "EU-02", strong: true },
            { text: "Europe", icon: <Landmark aria-hidden /> },
            "$36.5Mn",
            { text: "$172.4Mn", bar: 0.58 },
            { text: "372%", badge: "green" },
          ],
          [
            { text: "AS-03", strong: true },
            { text: "Asia", icon: <MountainSnow aria-hidden /> },
            "$25.9Mn",
            { text: "$98.1Mn", bar: 0.33 },
            { text: "279%", badge: "amber" },
          ],
          [
            { text: "NA-04", strong: true },
            { text: "North America", icon: <Globe aria-hidden /> },
            "$14.2Mn",
            { text: "$61.0Mn", bar: 0.2 },
            { text: "330%", badge: "blue" },
          ],
        ],
      },
    ],
  },
};
