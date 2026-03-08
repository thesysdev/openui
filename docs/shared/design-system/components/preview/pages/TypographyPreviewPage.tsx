// @ts-nocheck
import {
  PreviewPage,
  PreviewSection,
  TypographyTokenTable,
} from "@design-system/components/preview";

const typographySections = [
  {
    id: "heading",
    label: "Heading",
    description: "Display and hierarchy titles across pages and sections.",
  },
  {
    id: "body",
    label: "Body",
    description: "Long-form and supporting copy styles for content readability.",
  },
  {
    id: "label",
    label: "Label",
    description: "Compact labels for form controls, badges, and field metadata.",
  },
  {
    id: "numbers",
    label: "Numbers",
    description: "Numerical values for stats, metrics, and tabular data.",
  },
  {
    id: "code",
    label: "Code",
    description: "Monospace styles for snippets, tokens, and command text.",
  },
];

const typographyPreviewRows = {
  heading: [
    { token: "--text-heading-xl", sample: "Make something people want" },
    { token: "--text-heading-lg", sample: "Make something people want" },
    { token: "--text-heading-md", sample: "Make something people want" },
    { token: "--text-heading-sm", sample: "Make something people want" },
    { token: "--text-heading-xs", sample: "Make something people want" },
  ],
  body: [
    {
      token: "--text-body-lg",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-lg-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-default",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-default-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-sm",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-sm-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-xs",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--text-body-xs-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
  ],
  label: [
    { token: "--text-label-lg", sample: "Label Large" },
    { token: "--text-label-lg-heavy", sample: "Label Large Heavy" },
    { token: "--text-label-default", sample: "Label" },
    { token: "--text-label-default-heavy", sample: "Label Heavy" },
    { token: "--text-label-sm", sample: "Label Small" },
    { token: "--text-label-sm-heavy", sample: "Label Small Heavy" },
    { token: "--text-label-xs", sample: "Label Extra Small" },
    { token: "--text-label-xs-heavy", sample: "Label Extra Small Heavy" },
  ],
  numbers: [
    { token: "--text-numbers-lg", sample: "12,345,678.90" },
    { token: "--text-numbers-lg-heavy", sample: "9,876.54" },
    { token: "--text-numbers-default", sample: "345,678.12" },
    { token: "--text-numbers-default-heavy", sample: "123,456.78" },
    { token: "--text-numbers-sm", sample: "78,901.23" },
    { token: "--text-numbers-sm-heavy", sample: "56,789.01" },
    { token: "--text-numbers-xs", sample: "34,567.89" },
    { token: "--text-numbers-xs-heavy", sample: "12,345.67" },
  ],
  code: [
    { token: "--text-code-default", sample: "<Button variant='secondary' />" },
    { token: "--text-code-default-heavy", sample: "pnpm run build && pnpm run start" },
    { token: "--text-code-sm", sample: "const tokenName = '--text-code-sm';" },
    { token: "--text-code-sm-heavy", sample: "const tokenName = '--text-code-sm-heavy';" },
  ],
};

const getTypographyTokenStyle = (token) => ({
  font: `var(${token})`,
  letterSpacing: `var(${token}-letter-spacing)`,
  color: "var(--text-neutral-primary)",
});

const formatTypographyPreviewLabel = (token) => {
  const parts = token.replace(/^--text-/, "").split("-");
  const [category, ...rest] = parts;

  const formatPart = (part) => {
    if (part === "default") return "Default";
    if (part === "heavy") return "Heavy";
    return part.toUpperCase();
  };

  const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Text";
  const variantLabel = rest.map(formatPart).join("-");
  return variantLabel ? `${categoryLabel}-${variantLabel}` : categoryLabel;
};

export default function TypographyPreviewPage() {
  return (
    <PreviewPage>
      <PreviewSection
        title="Typography"
        headingLevel="h1"
        description="Type tokens grouped by heading, body, label, numbers, and code families."
      />

      {typographySections.map((section) => (
        <PreviewSection key={section.id} title={section.label} description={section.description}>
          <TypographyTokenTable
            items={(typographyPreviewRows[section.id] ?? []).map((row) => ({
              token: row.token,
              preview:
                section.id === "heading"
                  ? row.sample
                  : (row.sample ?? formatTypographyPreviewLabel(row.token)),
              className: row.token,
              style: getTypographyTokenStyle(row.token),
            }))}
          />
        </PreviewSection>
      ))}
    </PreviewPage>
  );
}
