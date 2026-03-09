"use client";

import {
  BlockVariantPreview,
  PreviewPage,
  PreviewSection,
  SegmentedToggle,
} from "@components/components/preview";
import { Tabs, TabsList, TabsTrigger } from "@openuidev/react-ui";
import { useState } from "react";
import styles from "./page.module.css";

type TabsVariant = "title" | "iconTitle" | "iconTitleSubtext" | "imageTitle" | "imageTitleSubtext";
type MediaMode = "none" | "icon" | "image";
type SubtextMode = "no" | "yes";
function resolveVariant(media: MediaMode, subtext: SubtextMode): TabsVariant {
  if (media === "icon") return subtext === "yes" ? "iconTitleSubtext" : "iconTitle";
  if (media === "image") return subtext === "yes" ? "imageTitleSubtext" : "imageTitle";
  return "title";
}

function promptDescription(media: MediaMode, subtext: SubtextMode): string {
  if (media === "none" && subtext === "no") return "";
  const parts: string[] = [];
  if (media !== "none") parts.push(media);
  if (subtext === "yes") parts.push("subtext");
  return ` with ${parts.join(" and ")}`;
}

const CITIES = [
  { value: "paris", label: "Paris", subtext: "France" },
  { value: "tokyo", label: "Tokyo", subtext: "Japan" },
  { value: "new-york", label: "New York", subtext: "USA" },
];

const CITY_ICONS: Record<string, string> = {
  paris: "✈️",
  tokyo: "🚢",
  "new-york": "🚌",
};

const CITY_IMAGES: Record<string, string> = {
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=64",
  tokyo: "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=64",
  "new-york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=64",
};

function TabsPreview({ variant }: { variant: TabsVariant }) {
  const showIcon = variant === "iconTitle" || variant === "iconTitleSubtext";
  const showImage = variant === "imageTitle" || variant === "imageTitleSubtext";
  const showSubtext = variant === "iconTitleSubtext" || variant === "imageTitleSubtext";

  return (
    <div className={styles.previewWrapper}>
      <Tabs defaultValue="paris">
        <TabsList variant={variant}>
          {CITIES.map((city) => (
            <TabsTrigger
              key={city.value}
              value={city.value}
              text={city.label}
              {...(showIcon ? { icon: <span>{CITY_ICONS[city.value]}</span> } : {})}
              {...(showImage ? { image: CITY_IMAGES[city.value] } : {})}
              {...(showSubtext ? { subtext: city.subtext } : {})}
            />
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function ConfigurableTabsPreview({ media, subtext }: { media: MediaMode; subtext: SubtextMode }) {
  const variant = resolveVariant(media, subtext);

  return <TabsPreview variant={variant} />;
}

function TabsControls({
  media,
  subtext,
  onMediaChange,
  onSubtextChange,
}: {
  media: MediaMode;
  subtext: SubtextMode;
  onMediaChange: (next: MediaMode) => void;
  onSubtextChange: (next: SubtextMode) => void;
}) {
  return (
    <div className={styles.controlsPanel}>
      <div className={styles.controlSection}>
        <SegmentedToggle
          ariaLabel="Media type"
          value={media}
          onChange={onMediaChange}
          options={[
            { label: "None", value: "none" as MediaMode },
            { label: "Icon", value: "icon" as MediaMode },
            { label: "Image", value: "image" as MediaMode },
          ]}
        />
      </div>
      <div className={styles.controlSection}>
        <SegmentedToggle
          ariaLabel="Subtext"
          value={subtext}
          onChange={onSubtextChange}
          options={[
            { label: "No subtext", value: "no" as SubtextMode },
            { label: "Subtext", value: "yes" as SubtextMode },
          ]}
        />
      </div>
    </div>
  );
}

export default function BlocksTabsPage() {
  const [media, setMedia] = useState<MediaMode>("none");
  const [subtext, setSubtext] = useState<SubtextMode>("no");

  return (
    <PreviewPage>
      <PreviewSection
        title="Tabs"
        headingLevel="h1"
        description="A row of labeled tabs that lets users switch between related content views, helping organize information within the same space and reduce clutter."
      >
        <BlockVariantPreview
          title="Default"
          description="Basic text-only tabs for simple section switching."
          preview={<TabsPreview variant="title" />}
          prompt="Use Default variant of tabs to group related content when <enter use case>."
        />
        <BlockVariantPreview
          title="Configurations"
          description="Explore different tab variants."
          preview={<ConfigurableTabsPreview media={media} subtext={subtext} />}
          rightControls={
            <TabsControls
              media={media}
              subtext={subtext}
              onMediaChange={setMedia}
              onSubtextChange={setSubtext}
            />
          }
          prompt={
            media === "none" && subtext === "no"
              ? "Use default variant of tabs to group related content when <enter use case>."
              : `Use tabs${promptDescription(media, subtext)} to group related content when <enter use case>.`
          }
        />
      </PreviewSection>
    </PreviewPage>
  );
}
