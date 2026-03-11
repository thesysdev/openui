"use client";

import ClientOnly from "@components/blocks/_components/ClientOnly";
import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import { LineChart, ScrollableLineChart } from "@openuidev/react-ui";

const lineData = [
  { month: "Jan", desktop: 150, mobile: 90 },
  { month: "Feb", desktop: 280, mobile: 180 },
  { month: "Mar", desktop: 220, mobile: 140 },
];

const scrollableLineData = [
  { month: "Jan", desktop: 150, mobile: 90 },
  { month: "Feb", desktop: 280, mobile: 180 },
  { month: "Mar", desktop: 220, mobile: 140 },
  { month: "Apr", desktop: 260, mobile: 170 },
  { month: "May", desktop: 300, mobile: 210 },
  { month: "Jun", desktop: 320, mobile: 220 },
  { month: "Jul", desktop: 310, mobile: 205 },
  { month: "Aug", desktop: 340, mobile: 230 },
  { month: "Sep", desktop: 360, mobile: 245 },
  { month: "Oct", desktop: 390, mobile: 265 },
];

function DefaultLineChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <LineChart data={lineData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

function ScrollableLineChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <ScrollableLineChart data={scrollableLineData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

export default function BlocksLineChartPage() {
  return (
    <PreviewPage>
      <PreviewSection
        title="Line"
        headingLevel="h1"
        description="Preview for the Line chart block."
      >
        <BlockVariantPreview
          title="Default"
          description="Default line chart variant."
          preview={<DefaultLineChartPreview />}
        />
        <BlockVariantPreview
          title="Scrollable"
          description="Scrollable line chart variant."
          preview={<ScrollableLineChartPreview />}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
