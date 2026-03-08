"use client";

import ClientOnly from "@components/blocks/_components/ClientOnly";
import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import { BarChart, ScrollableBarChart } from "@openuidev/react-ui";

const barData = [
  { month: "Jan", desktop: 150, mobile: 90 },
  { month: "Feb", desktop: 280, mobile: 180 },
  { month: "Mar", desktop: 220, mobile: 140 },
];

const scrollableBarData = [
  { month: "Jan", desktop: 150, mobile: 90 },
  { month: "Feb", desktop: 280, mobile: 180 },
  { month: "Mar", desktop: 220, mobile: 140 },
  { month: "Apr", desktop: 310, mobile: 200 },
  { month: "May", desktop: 260, mobile: 170 },
  { month: "Jun", desktop: 330, mobile: 220 },
  { month: "Jul", desktop: 295, mobile: 190 },
  { month: "Aug", desktop: 360, mobile: 240 },
  { month: "Sep", desktop: 340, mobile: 230 },
  { month: "Oct", desktop: 380, mobile: 250 },
];

function DefaultBarChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <BarChart data={barData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

function ScrollableBarChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <ScrollableBarChart data={scrollableBarData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

export default function BlocksBarChartPage() {
  return (
    <PreviewPage>
      <PreviewSection title="Bar" headingLevel="h1" description="Preview for the Bar chart block.">
        <BlockVariantPreview
          title="Default"
          description="Default bar chart variant."
          preview={<DefaultBarChartPreview />}
        />
        <BlockVariantPreview
          title="Scrollable"
          description="Scrollable bar chart variant."
          preview={<ScrollableBarChartPreview />}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
