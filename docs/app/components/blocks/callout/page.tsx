"use client";

import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TextCallout,
} from "@openuidev/react-ui";
import { useState } from "react";

type CalloutVariant = "neutral" | "info" | "warning" | "success" | "danger";

function CalloutPreview({ variant }: { variant: CalloutVariant }) {
  return (
    <div style={{ width: "600px" }}>
      <TextCallout
        variant={variant}
        title="Heads up"
        description="Use callouts to highlight important information, warnings, or guidance."
      />
    </div>
  );
}

export default function BlocksCalloutPage() {
  const [variant, setVariant] = useState<CalloutVariant>("neutral");

  return (
    <PreviewPage>
      <PreviewSection
        title="Callout"
        headingLevel="h1"
        description="Highlights important information, warnings, or guidance within content. Helps draw attention to critical messages without breaking flow."
      >
        <BlockVariantPreview
          title="Basic"
          description="A callout with selectable variant."
          headerControl={
            <div style={{ width: "160px" }}>
              <Select
                value={variant}
                onValueChange={(value) => setVariant(value as CalloutVariant)}
              >
                <SelectTrigger size="sm" style={{ width: "160px" }}>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent className="openui-select-content-sm">
                  <SelectItem value="neutral" showTick={false}>
                    Neutral
                  </SelectItem>
                  <SelectItem value="info" showTick={false}>
                    Info
                  </SelectItem>
                  <SelectItem value="warning" showTick={false}>
                    Warning
                  </SelectItem>
                  <SelectItem value="success" showTick={false}>
                    Success
                  </SelectItem>
                  <SelectItem value="danger" showTick={false}>
                    Danger
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
          preview={<CalloutPreview variant={variant} />}
          prompt={`Use ${variant} callout to highlight important information when <enter use case>.`}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
