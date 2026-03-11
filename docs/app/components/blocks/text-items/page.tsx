"use client";

import { BlockVariantPreview, PreviewPage, PreviewSection } from "@components/components/preview";
import styles from "./page.module.css";

const TextBlock = (_props: any) => {
  return "";
};

function TitleTextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="title-text"
          primary="Title Text"
          secondary="Supporting description"
          type="text"
          size="xs"
          align="left"
        />
        <TextBlock
          variant="title-text"
          primary="Title Text"
          secondary="Supporting description"
          type="text"
          size="sm"
          align="left"
        />
        <TextBlock
          variant="title-text"
          primary="Title Text"
          secondary="Supporting description"
          type="text"
          size="md"
          align="left"
        />
        <TextBlock
          variant="title-text"
          primary="Title Text"
          secondary="Supporting description"
          type="text"
          size="lg"
          align="left"
        />
      </div>
    </div>
  );
}

function NumberTitleTextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="number-title-text"
          primary="$156,800"
          secondary="Total Revenue"
          tertiary="Updated 2h ago"
          type="number"
          size="xs"
          align="left"
        />
        <TextBlock
          variant="number-title-text"
          primary="$156,800"
          secondary="Total Revenue"
          tertiary="Updated 2h ago"
          type="number"
          size="sm"
          align="left"
        />
        <TextBlock
          variant="number-title-text"
          primary="$156,800"
          secondary="Total Revenue"
          tertiary="Updated 2h ago"
          type="number"
          size="md"
          align="left"
        />
        <TextBlock
          variant="number-title-text"
          primary="$156,800"
          secondary="Total Revenue"
          tertiary="Updated 2h ago"
          type="number"
          size="lg"
          align="left"
        />
      </div>
    </div>
  );
}

function TextSubtextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="text-subtext"
          primary="Active Users"
          secondary="Currently online"
          type="text"
          size="xs"
          align="left"
        />
        <TextBlock
          variant="text-subtext"
          primary="Active Users"
          secondary="Currently online"
          type="text"
          size="sm"
          align="left"
        />
        <TextBlock
          variant="text-subtext"
          primary="Active Users"
          secondary="Currently online"
          type="text"
          size="md"
          align="left"
        />
        <TextBlock
          variant="text-subtext"
          primary="Active Users"
          secondary="Currently online"
          type="text"
          size="lg"
          align="left"
        />
      </div>
    </div>
  );
}

function HighlightTextNumberSubtextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$9,250"
          secondary="+18.5%"
          type="number"
          size="xs"
          align="left"
          secondaryTone="positive"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$9,250"
          secondary="+18.5%"
          type="number"
          size="sm"
          align="left"
          secondaryTone="positive"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$9,250"
          secondary="+18.5%"
          type="number"
          size="md"
          align="left"
          secondaryTone="positive"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$9,250"
          secondary="+18.5%"
          type="number"
          size="lg"
          align="left"
          secondaryTone="positive"
        />
      </div>
    </div>
  );
}

function HighlightTextNumberSubtextNegativePreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$4,120"
          secondary="-7.2%"
          type="number"
          size="xs"
          align="left"
          secondaryTone="negative"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$4,120"
          secondary="-7.2%"
          type="number"
          size="sm"
          align="left"
          secondaryTone="negative"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$4,120"
          secondary="-7.2%"
          type="number"
          size="md"
          align="left"
          secondaryTone="negative"
        />
        <TextBlock
          variant="highlight-text-number-subtext"
          primary="$4,120"
          secondary="-7.2%"
          type="number"
          size="lg"
          align="left"
          secondaryTone="negative"
        />
      </div>
    </div>
  );
}

function TextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock variant="text" primary="Plain text label" size="xs" align="left" />
        <TextBlock variant="text" primary="Plain text label" size="sm" align="left" />
        <TextBlock variant="text" primary="Plain text label" size="md" align="left" />
        <TextBlock variant="text" primary="Plain text label" size="lg" align="left" />
      </div>
    </div>
  );
}

function HighlightTextPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock variant="highlight-text" primary="Highlighted label" size="xs" align="left" />
        <TextBlock variant="highlight-text" primary="Highlighted label" size="sm" align="left" />
        <TextBlock variant="highlight-text" primary="Highlighted label" size="md" align="left" />
        <TextBlock variant="highlight-text" primary="Highlighted label" size="lg" align="left" />
      </div>
    </div>
  );
}

function NumberPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock variant="number" primary="42,847" type="number" size="xs" align="left" />
        <TextBlock variant="number" primary="42,847" type="number" size="sm" align="left" />
        <TextBlock variant="number" primary="42,847" type="number" size="md" align="left" />
        <TextBlock variant="number" primary="42,847" type="number" size="lg" align="left" />
      </div>
    </div>
  );
}

function HighlightNumberPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="highlight-number"
          primary="$9,250"
          type="number"
          size="xs"
          align="left"
        />
        <TextBlock
          variant="highlight-number"
          primary="$9,250"
          type="number"
          size="sm"
          align="left"
        />
        <TextBlock
          variant="highlight-number"
          primary="$9,250"
          type="number"
          size="md"
          align="left"
        />
        <TextBlock
          variant="highlight-number"
          primary="$9,250"
          type="number"
          size="lg"
          align="left"
        />
      </div>
    </div>
  );
}

function AlignmentPreview() {
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.sizesGrid}>
        <TextBlock
          variant="title-text"
          primary="Left aligned"
          secondary="Description text"
          size="md"
          align="left"
        />
        <TextBlock
          variant="title-text"
          primary="Center aligned"
          secondary="Description text"
          size="md"
          align="center"
        />
        <TextBlock
          variant="title-text"
          primary="Right aligned"
          secondary="Description text"
          size="md"
          align="right"
        />
      </div>
    </div>
  );
}

export default function BlocksTextItemsPage() {
  return (
    <PreviewPage>
      <PreviewSection
        title="Text Block"
        headingLevel="h1"
        description="Flexible text display component with multiple layout variants, sizes, types, and alignment options. Used inside cards and standalone for titles, metrics, and labels."
      >
        <BlockVariantPreview
          title="Title Text"
          description="Primary heading with secondary subtitle. Sizes: xs, sm, md, lg."
          preview={<TitleTextPreview />}
        />

        <BlockVariantPreview
          title="Number Title Text"
          description="Large number with title and tertiary line. Sizes: xs, sm, md, lg."
          preview={<NumberTitleTextPreview />}
        />

        <BlockVariantPreview
          title="Text Subtext"
          description="Compact primary text with smaller subtext. Sizes: xs, sm, md, lg."
          preview={<TextSubtextPreview />}
        />

        <BlockVariantPreview
          title="Highlight + Number Subtext (Positive)"
          description="Bold value with positive metric subtext. Sizes: xs, sm, md, lg."
          preview={<HighlightTextNumberSubtextPreview />}
        />

        <BlockVariantPreview
          title="Highlight + Number Subtext (Negative)"
          description="Bold value with negative metric subtext. Sizes: xs, sm, md, lg."
          preview={<HighlightTextNumberSubtextNegativePreview />}
        />

        <BlockVariantPreview
          title="Text"
          description="Single-line plain text. Sizes: xs, sm, md, lg."
          preview={<TextPreview />}
        />

        <BlockVariantPreview
          title="Highlight Text"
          description="Single-line emphasised text. Sizes: xs, sm, md, lg."
          preview={<HighlightTextPreview />}
        />

        <BlockVariantPreview
          title="Number"
          description="Single-line number display. Sizes: xs, sm, md, lg."
          preview={<NumberPreview />}
        />

        <BlockVariantPreview
          title="Highlight Number"
          description="Single-line emphasised number. Sizes: xs, sm, md, lg."
          preview={<HighlightNumberPreview />}
        />

        <BlockVariantPreview
          title="Alignment"
          description="Left, center, and right alignment options."
          preview={<AlignmentPreview />}
        />
      </PreviewSection>
    </PreviewPage>
  );
}
