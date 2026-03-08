"use client";

import {
  BlockVariantPreview,
  PreviewPage,
  PreviewSection,
  SegmentedToggle,
} from "@components/components/preview";
import {
  Button,
  Buttons,
  IconButton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";
import { useState } from "react";
import styles from "./page.module.css";

type ButtonType = "normal" | "destructive";
type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonContentMode = "text" | "icon";

function buildSingleButtonPrompt({
  buttonType,
  buttonVariant,
  buttonContentMode,
}: {
  buttonType: ButtonType;
  buttonVariant: ButtonVariant;
  buttonContentMode: ButtonContentMode;
}) {
  const contentLabel = buttonContentMode === "icon" ? "icon-only" : "text";
  const destructivePrefix = buttonType === "destructive" ? "destructive " : "";
  return `Use a ${destructivePrefix}${buttonVariant} ${contentLabel} button for <enter use case>.`;
}

function SingleButtonPreview({
  buttonType,
  buttonVariant,
  buttonContentMode,
}: {
  buttonType: ButtonType;
  buttonVariant: ButtonVariant;
  buttonContentMode: ButtonContentMode;
}) {
  return (
    <div className={styles.previewWrapper}>
      {buttonContentMode === "text" ? (
        <Button variant={buttonVariant} buttonType={buttonType}>
          {buttonVariant[0].toUpperCase() + buttonVariant.slice(1)}
        </Button>
      ) : (
        <IconButton
          icon={
            <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          variant={buttonVariant}
          appearance={buttonType}
          aria-label="Download"
        />
      )}
    </div>
  );
}

function ButtonsGroupPreview() {
  const downloadIcon = (
    <svg aria-hidden viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path
        d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Buttons variant="horizontal" style={{ width: "fit-content" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <IconButton icon={downloadIcon} variant="tertiary" aria-label="Download" />
    </Buttons>
  );
}

function ButtonControls({
  buttonType,
  buttonVariant,
  buttonContentMode,
  onButtonTypeChange,
  onButtonVariantChange,
  onButtonContentModeChange,
}: {
  buttonType: ButtonType;
  buttonVariant: ButtonVariant;
  buttonContentMode: ButtonContentMode;
  onButtonTypeChange: (next: ButtonType) => void;
  onButtonVariantChange: (next: ButtonVariant) => void;
  onButtonContentModeChange: (next: ButtonContentMode) => void;
}) {
  return (
    <div className={styles.controlsPanel}>
      <div className={styles.controlSection}>
        <SegmentedToggle
          ariaLabel="Button type"
          value={buttonType}
          onChange={onButtonTypeChange}
          options={[
            { label: "Normal", value: "normal" },
            { label: "Destructive", value: "destructive" },
          ]}
        />
      </div>

      <div className={styles.controlSection}>
        <Select
          value={buttonVariant}
          onValueChange={(value) => onButtonVariantChange(value as ButtonVariant)}
        >
          <SelectTrigger size="md" style={{ width: "100%" }}>
            <SelectValue placeholder="Variant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary" showTick={false}>
              Primary
            </SelectItem>
            <SelectItem value="secondary" showTick={false}>
              Secondary
            </SelectItem>
            <SelectItem value="tertiary" showTick={false}>
              Tertiary
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={styles.controlSection}>
        <SegmentedToggle
          ariaLabel="Button content mode"
          value={buttonContentMode}
          onChange={onButtonContentModeChange}
          options={[
            { label: "Text", value: "text" },
            { label: "Icon", value: "icon" },
          ]}
        />
      </div>
    </div>
  );
}

export default function BlocksButtonGroupPage() {
  const [buttonType, setButtonType] = useState<ButtonType>("normal");
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>("primary");
  const [buttonContentMode, setButtonContentMode] = useState<ButtonContentMode>("text");

  return (
    <PreviewPage>
      <PreviewSection
        title="Buttons"
        headingLevel="h1"
        description="You already know who am I and what I do."
      >
        <BlockVariantPreview
          title="Atom"
          description="A single button."
          preview={
            <SingleButtonPreview
              buttonType={buttonType}
              buttonVariant={buttonVariant}
              buttonContentMode={buttonContentMode}
            />
          }
          rightControls={
            <ButtonControls
              buttonType={buttonType}
              buttonVariant={buttonVariant}
              buttonContentMode={buttonContentMode}
              onButtonTypeChange={setButtonType}
              onButtonVariantChange={setButtonVariant}
              onButtonContentModeChange={setButtonContentMode}
            />
          }
          prompt={buildSingleButtonPrompt({ buttonType, buttonVariant, buttonContentMode })}
        />
        <BlockVariantPreview
          title="Button group"
          description="A group of buttons to present related actions."
          preview={<ButtonsGroupPreview />}
          prompt="Use a button group to present related actions in one row when <enter use case>."
        />
      </PreviewSection>
    </PreviewPage>
  );
}
