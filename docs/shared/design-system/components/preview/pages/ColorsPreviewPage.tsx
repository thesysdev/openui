import {
  ColorSwatchesPreviewSection,
  ColorTokenTable,
  PreviewPage,
  PreviewSection,
} from "@design-system/components/preview";
import tableStyles from "@design-system/components/preview/FoundationTokenTable.module.css";

const surfaceItems = [
  { token: "--background", useCase: "Page and canvas backgrounds." },
  { token: "--foreground", useCase: "Card and container surfaces." },
  { token: "--popover-background", useCase: "Floating surfaces like popovers and menus." },
  { token: "--sunk", useCase: "Inset areas and subtle pressed backgrounds." },
  { token: "--elevated", useCase: "Raised layers and elevated fills." },
  { token: "--highlight", useCase: "Hover emphasis on neutral surfaces." },
  { token: "--inverted-background", useCase: "High-contrast inverse surface." },
];

const textItems = [
  { token: "--text-neutral-primary", useCase: "Primary readable text." },
  { token: "--text-neutral-secondary", useCase: "Secondary descriptive copy." },
  { token: "--text-neutral-tertiary", useCase: "Subtle helper text." },
  { token: "--text-neutral-link", useCase: "Default link text." },
  { token: "--text-success-primary", useCase: "Success state messaging." },
  { token: "--text-alert-primary", useCase: "Warning and alert messaging." },
  { token: "--text-danger-primary", useCase: "Error and destructive messaging." },
  { token: "--text-info-primary", useCase: "Informational messaging." },
];

const interactiveBrandItems = [
  { token: "--interactive-accent-default", useCase: "Primary accent action default fill." },
  { token: "--interactive-accent-hover", useCase: "Primary accent action hover fill." },
  { token: "--interactive-accent-pressed", useCase: "Primary accent action pressed fill." },
  { token: "--interactive-accent-disabled", useCase: "Primary accent action disabled fill." },
];

const interactiveDestructiveItems = [
  {
    token: "--interactive-destructive-accent-default",
    useCase: "Destructive action default fill.",
  },
  { token: "--interactive-destructive-accent-hover", useCase: "Destructive action hover fill." },
  {
    token: "--interactive-destructive-accent-pressed",
    useCase: "Destructive action pressed fill.",
  },
  {
    token: "--interactive-destructive-accent-disabled",
    useCase: "Destructive action disabled fill.",
  },
];

const borderItems = [
  { token: "--border-default", useCase: "Default outlines and separators." },
  { token: "--border-interactive", useCase: "Interactive element borders." },
  { token: "--border-interactive-emphasis", useCase: "High emphasis outlines." },
  { token: "--border-interactive-selected", useCase: "Selected state borders." },
  { token: "--border-info-emphasis", useCase: "Info-emphasis border state." },
  { token: "--border-alert-emphasis", useCase: "Alert-emphasis border state." },
  { token: "--border-success-emphasis", useCase: "Success-emphasis border state." },
  { token: "--border-danger-emphasis", useCase: "Danger-emphasis border state." },
];

const swatchScale = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 925, 950, 1000];
const swatchFamilies = [
  "neutral",
  "gray",
  "zinc",
  "stone",
  "blue",
  "sky",
  "cyan",
  "teal",
  "emerald",
  "lime",
  "amber",
  "orange",
  "green",
  "yellow",
  "red",
  "purple",
  "violet",
  "fuchsia",
  "pink",
];

const alphaScale = [
  "a02",
  "a04",
  "a06",
  "a08",
  "a10",
  "a12",
  "a20",
  "a30",
  "a40",
  "a50",
  "a60",
  "a70",
  "a80",
  "a90",
  "a100",
];
const familyAlphaScale = [
  "a02",
  "a04",
  "a06",
  "a08",
  "a10",
  "a12",
  "a20",
  "a30",
  "a40",
  "a50",
  "a60",
  "a70",
  "a80",
  "a90",
  "a100",
];
const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const familyTitleByFamily = {
  gray: "Steel",
  zinc: "Iron",
  stone: "Graphite",
};
const familyAlphaBaseByFamily = {
  neutral: 1000,
  slate: 1000,
  gray: 1000,
  zinc: 1000,
  stone: 1000,
};
const buildPaletteRow = (family: string) => ({
  id: `swatch-${family}`,
  title: (familyTitleByFamily as Record<string, string>)[family] ?? toTitleCase(family),
  tokens: swatchScale.map((step) => `--swatch-${family}-${step}`),
});
const buildFamilyAlphaRow = (family: string) => ({
  id: `swatch-alpha-${family}`,
  title: `${(familyTitleByFamily as Record<string, string>)[family] ?? toTitleCase(family)} alpha`,
  tokens: familyAlphaScale.map(
    (step) =>
      `--swatch-${family}-${(familyAlphaBaseByFamily as Record<string, number>)[family] ?? 600}-${step}`,
  ),
});

const colorSwatchRows = [
  ...swatchFamilies.flatMap((family) => [buildPaletteRow(family), buildFamilyAlphaRow(family)]),
  {
    id: "swatch-alpha-black",
    title: "Black alpha",
    tokens: alphaScale.map((step) => `--swatch-black-${step}`),
  },
  {
    id: "swatch-alpha-white",
    title: "White alpha",
    tokens: alphaScale.map((step) => `--swatch-white-${step}`),
  },
];

const swatchesCode = `:root {
  --swatch-black: oklch(...);
  --swatch-white: oklch(...);

  --swatch-neutral-25: oklch(...);
  --swatch-neutral-50: oklch(...);
  /* ... all base palette swatches ... */

  --swatch-black-a00: oklch(...);
  --swatch-white-a00: oklch(...);
  /* ... utility alpha swatches ... */
}`;

export default function ColorsPreviewPage() {
  return (
    <PreviewPage>
      <PreviewSection
        id="foundation"
        title="Colors"
        headingLevel="h1"
        description="Foundation palette and semantic color tokens for surfaces, text, interactive states, and strokes."
      />

      <PreviewSection
        title="Surface"
        description="Surface tokens establish depth, contrast, and baseline backgrounds."
      >
        <ColorTokenTable items={surfaceItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Surface components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Text"
        description="Text tokens support hierarchy and semantic messaging states."
      >
        <ColorTokenTable items={textItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Text components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Accent"
        description="Accent interaction tokens define visual states for primary actions."
      >
        <ColorTokenTable items={interactiveBrandItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Accent components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Destructive"
        description="Destructive interaction tokens define visual states for destructive actions."
      >
        <ColorTokenTable items={interactiveDestructiveItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Destructive components preview coming soon.
        </div>
      </PreviewSection>

      <PreviewSection
        title="Stroke"
        description="Stroke tokens define default and semantic borders across components."
      >
        <ColorTokenTable items={borderItems} />
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Stroke components preview coming soon.
        </div>
      </PreviewSection>

      <ColorSwatchesPreviewSection
        id="swatches"
        title="Color swatches"
        description="Complete swatch palette shown below the semantic variable tokens."
        rows={colorSwatchRows}
        code={swatchesCode}
      />
    </PreviewPage>
  );
}
