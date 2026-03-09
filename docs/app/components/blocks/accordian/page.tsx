"use client";

import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openuidev/react-ui";
import { useState } from "react";
import styles from "./page.module.css";

type VariantMode = "clear" | "card" | "sunk";
type TypeMode = "single" | "multiple";

const VARIANT_OPTIONS: { value: VariantMode; label: string }[] = [
  { value: "clear", label: "Clear" },
  { value: "card", label: "Card" },
  { value: "sunk", label: "Sunk" },
];

const TYPE_OPTIONS: { value: TypeMode; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "multiple", label: "Multiple" },
];

const ACCORDION_ITEMS = [
  {
    value: "item-1",
    trigger: "What is OpenUI UI?",
    content:
      "OpenUI UI is a design system and component library for building consistent, polished interfaces.",
  },
  {
    value: "item-2",
    trigger: "How do I install it?",
    content: "Install via pnpm: pnpm add @openuidev/react-ui",
  },
  {
    value: "item-3",
    trigger: "Can I customise the theme?",
    content:
      "Yes — OpenUI UI supports full theming through CSS custom properties and SCSS design tokens.",
  },
];

function ClearPreview() {
  return (
    <div className={styles.previewWrapper}>
      <Accordion type="single" collapsible variant="clear" defaultValue="item-1">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger text={item.trigger} />
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function CardPreview() {
  return (
    <div className={styles.previewWrapper}>
      <Accordion type="single" collapsible variant="card" defaultValue="item-1">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger text={item.trigger} />
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function SunkPreview() {
  return (
    <div className={styles.previewWrapper}>
      <Accordion type="single" collapsible variant="sunk" defaultValue="item-1">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger text={item.trigger} />
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function ConfigurableAccordionPreview({ variant, type }: { variant: VariantMode; type: TypeMode }) {
  if (type === "multiple") {
    return (
      <div className={styles.previewWrapper}>
        <Accordion type="multiple" variant={variant} defaultValue={["item-1"]}>
          {ACCORDION_ITEMS.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger text={item.trigger} />
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  return (
    <div className={styles.previewWrapper}>
      <Accordion type="single" collapsible variant={variant} defaultValue="item-1">
        {ACCORDION_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger text={item.trigger} />
            <AccordionContent>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function AccordionControls({
  variant,
  type,
  onVariantChange,
  onTypeChange,
}: {
  variant: VariantMode;
  type: TypeMode;
  onVariantChange: (next: VariantMode) => void;
  onTypeChange: (next: TypeMode) => void;
}) {
  return (
    <div className={styles.controlsPanel}>
      <div className={styles.controlSection}>
        <p className={styles.sectionTitle}>Variant</p>
        <Select value={variant} onValueChange={(v) => onVariantChange(v as VariantMode)}>
          <SelectTrigger size="sm" className={styles.selectWrapper}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VARIANT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.controlSection}>
        <p className={styles.sectionTitle}>Type</p>
        <Select value={type} onValueChange={(v) => onTypeChange(v as TypeMode)}>
          <SelectTrigger size="sm" className={styles.selectWrapper}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function BlocksAccordianPage() {
  const [variant, setVariant] = useState<VariantMode>("clear");
  const [type, setType] = useState<TypeMode>("single");

  return (
    <PreviewPage>
      <PreviewSection
        title="Accordion"
        headingLevel="h1"
        description="Vertically stacked, collapsible content sections."
      >
        <BlockVariantPreview
          title="Clear"
          description="Minimal style without borders or background. Best for inline content sections."
          preview={<ClearPreview />}
        />

        <BlockVariantPreview
          title="Card"
          description="Each item rendered as a card with subtle elevation. Great for FAQ pages and settings."
          preview={<CardPreview />}
        />

        <BlockVariantPreview
          title="Sunk"
          description="Recessed background style. Ideal for grouped content within a panel."
          preview={<SunkPreview />}
        />

        <BlockVariantPreview
          title="Configurations"
          description="Customise variant and expand behaviour."
          preview={<ConfigurableAccordionPreview variant={variant} type={type} />}
          rightControls={
            <AccordionControls
              variant={variant}
              type={type}
              onVariantChange={setVariant}
              onTypeChange={setType}
            />
          }
        />
      </PreviewSection>
    </PreviewPage>
  );
}
