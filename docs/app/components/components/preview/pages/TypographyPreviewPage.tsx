import { PreviewPage, PreviewSection, TypographyTokenTable } from "@components/components/preview";

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

const typographyPreviewRows: Record<string, { token: string; sample: string }[]> = {
  heading: [
    { token: "--openui-text-heading-xl", sample: "Make something people want" },
    { token: "--openui-text-heading-lg", sample: "Make something people want" },
    { token: "--openui-text-heading-md", sample: "Make something people want" },
    { token: "--openui-text-heading-sm", sample: "Make something people want" },
    { token: "--openui-text-heading-xs", sample: "Make something people want" },
  ],
  body: [
    {
      token: "--openui-text-body-lg",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-lg-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-default",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-default-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-sm",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-sm-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-xs",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
    {
      token: "--openui-text-body-xs-heavy",
      sample:
        "Body copy should stay comfortable to scan on long paragraphs and dense content surfaces.",
    },
  ],
  label: [
    { token: "--openui-text-label-lg", sample: "Label Large" },
    { token: "--openui-text-label-lg-heavy", sample: "Label Large Heavy" },
    { token: "--openui-text-label-default", sample: "Label" },
    { token: "--openui-text-label-default-heavy", sample: "Label Heavy" },
    { token: "--openui-text-label-sm", sample: "Label Small" },
    { token: "--openui-text-label-sm-heavy", sample: "Label Small Heavy" },
    { token: "--openui-text-label-xs", sample: "Label Extra Small" },
    { token: "--openui-text-label-xs-heavy", sample: "Label Extra Small Heavy" },
  ],
  numbers: [
    { token: "--openui-text-numbers-lg", sample: "12,345,678.90" },
    { token: "--openui-text-numbers-lg-heavy", sample: "9,876.54" },
    { token: "--openui-text-numbers-default", sample: "345,678.12" },
    { token: "--openui-text-numbers-default-heavy", sample: "123,456.78" },
    { token: "--openui-text-numbers-sm", sample: "78,901.23" },
    { token: "--openui-text-numbers-sm-heavy", sample: "56,789.01" },
    { token: "--openui-text-numbers-xs", sample: "34,567.89" },
    { token: "--openui-text-numbers-xs-heavy", sample: "12,345.67" },
  ],
  code: [
    { token: "--openui-text-code-default", sample: "<Button variant='secondary' />" },
    { token: "--openui-text-code-default-heavy", sample: "pnpm run build && pnpm run start" },
    { token: "--openui-text-code-sm", sample: "const tokenName = '--openui-text-code-sm';" },
    {
      token: "--openui-text-code-sm-heavy",
      sample: "const tokenName = '--openui-text-code-sm-heavy';",
    },
  ],
};

const getTypographyTokenStyle = (token: string) => ({
  font: `var(${token})`,
  letterSpacing: `var(${token}-letter-spacing)`,
  color: "var(--openui-text-neutral-primary)",
});

const formatTypographyPreviewLabel = (token: string) => {
  const parts = token.replace(/^--openui-text-/, "").split("-");
  const [category, ...rest] = parts;

  const formatPart = (part: string) => {
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
