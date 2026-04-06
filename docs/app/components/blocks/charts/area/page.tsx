"use client";

import ClientOnly from "@components/blocks/_components/ClientOnly";
import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import { AreaChart, AreaChartCondensed } from "@openuidev/react-ui";

const areaData = [
  { month: "Jan", desktop: 150, mobile: 90 },
  { month: "Feb", desktop: 280, mobile: 180 },
  { month: "Mar", desktop: 220, mobile: 140 },
];

const scrollableAreaData = [
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

function DefaultAreaChartPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <AreaChart data={areaData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

function AreaChartCondensedPreview() {
  return (
    <ClientOnly>
      <div style={{ width: "600px" }}>
        <AreaChartCondensed data={scrollableAreaData} categoryKey="month" />
      </div>
    </ClientOnly>
  );
}

export default function BlocksAreaChartPage() {
  return (
    <PreviewPage>
      <PreviewSection
        title="Area"
        headingLevel="h1"
        description="Preview for the Area chart block."
      >
        <BlockVariantPreview
          title="Scrollable"
          description="Scrollable area chart variant."
          preview={<DefaultAreaChartPreview />}
        />
        <BlockVariantPreview
          title="Condensed"
          description="Condensed area chart variant."
          preview={<AreaChartCondensedPreview />}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
