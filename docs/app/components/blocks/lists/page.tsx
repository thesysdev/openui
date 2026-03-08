"use client";

import {
  BlockVariantPreview,
  PreviewPage,
  PreviewSection,
  SegmentedToggle,
} from "@components/components/preview";
import { ListBlock, ListItem } from "@openuidev/react-ui";
import { ChevronRight, FileText, Globe, LayoutPanelTop } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

type ListVariant = "number" | "icon" | "image";
type ListInteractionMode = "static" | "clickable";

function ListsPreview({
  variant,
  showDescription,
  interactionMode,
}: {
  variant: ListVariant;
  showDescription: boolean;
  interactionMode: ListInteractionMode;
}) {
  const descriptionFor = (text: string) => (showDescription ? text : undefined);

  const commonActionProps = useMemo(() => {
    if (interactionMode === "static") {
      return {};
    }
    return {
      actionIcon: <ChevronRight size={16} />,
      onClick: () => undefined,
    };
  }, [interactionMode]);

  return (
    <div className={styles.previewWrapper}>
      <div className={styles.previewInner}>
        <ListBlock variant={variant}>
          <ListItem
            variant={variant}
            index={0}
            listHasSubtitle={showDescription}
            icon={variant === "icon" ? <FileText size={16} /> : undefined}
            image={variant === "image" ? { src: "/file.svg", alt: "File" } : undefined}
            title="Connect your data"
            subtitle={descriptionFor("Link your database or upload a CSV to get started.")}
            {...commonActionProps}
          />
          <ListItem
            variant={variant}
            index={1}
            listHasSubtitle={showDescription}
            icon={variant === "icon" ? <Globe size={16} /> : undefined}
            image={variant === "image" ? { src: "/globe.svg", alt: "Globe" } : undefined}
            title="Choose a goal"
            subtitle={descriptionFor("Summarize, classify, extract, or generate UI from prompts.")}
            {...commonActionProps}
          />
          <ListItem
            variant={variant}
            index={2}
            listHasSubtitle={showDescription}
            icon={variant === "icon" ? <LayoutPanelTop size={16} /> : undefined}
            image={variant === "image" ? { src: "/window.svg", alt: "Window" } : undefined}
            title="Review and refine"
            subtitle={descriptionFor("Edit the result and rerun with tighter instructions.")}
            {...commonActionProps}
          />
        </ListBlock>
      </div>
    </div>
  );
}

export default function BlocksListsPage() {
  const [variant, setVariant] = useState<ListVariant>("number");
  const [description, setDescription] = useState<"show" | "hide">("show");
  const [interactionMode, setInteractionMode] = useState<ListInteractionMode>("static");

  const showDescription = description === "show";

  return (
    <PreviewPage>
      <PreviewSection
        title="Lists"
        headingLevel="h1"
        description="Presents ordered or structured items in a vertical, easy-to-scan format. Great for steps, tasks, or grouped information."
      >
        <BlockVariantPreview
          preview={<ListsPreview variant="number" showDescription interactionMode="static" />}
          prompt="Use numbered list with description to display ordered items when <enter use case>."
        />

        <BlockVariantPreview
          title="Configurations"
          description="Toggle list variant, description, and interaction."
          preview={
            <ListsPreview
              variant={variant}
              showDescription={showDescription}
              interactionMode={interactionMode}
            />
          }
          prompt={`Use ${variant} list${showDescription ? " with description" : ""}${interactionMode === "clickable" ? " and clickable items" : ""} to display structured items when <enter use case>.`}
          rightControls={
            <div className={styles.controlsPanel}>
              <div className={styles.controlSection}>
                <p className={styles.sectionTitle}>Variant</p>
                <SegmentedToggle
                  ariaLabel="Toggle list indicator variant"
                  value={variant}
                  onChange={(value) => setVariant(value as ListVariant)}
                  options={[
                    { label: "Number", value: "number" },
                    { label: "Icon", value: "icon" },
                    { label: "Image", value: "image" },
                  ]}
                />
              </div>

              <div className={styles.controlSection}>
                <p className={styles.sectionTitle}>Description</p>
                <SegmentedToggle
                  ariaLabel="Toggle description visibility"
                  value={description}
                  onChange={(value) => setDescription(value as "show" | "hide")}
                  options={[
                    { label: "Show", value: "show" },
                    { label: "Hide", value: "hide" },
                  ]}
                />
              </div>

              <div className={styles.controlSection}>
                <p className={styles.sectionTitle}>Interaction</p>
                <SegmentedToggle
                  ariaLabel="Toggle list interaction mode"
                  value={interactionMode}
                  onChange={(value) => setInteractionMode(value as ListInteractionMode)}
                  options={[
                    { label: "Static", value: "static" },
                    { label: "Clickable", value: "clickable" },
                  ]}
                />
              </div>
            </div>
          }
        />
      </PreviewSection>
    </PreviewPage>
  );
}
