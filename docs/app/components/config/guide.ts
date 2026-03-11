export interface GuidePreviewCard {
  id: string;
  title: string;
  description: string;
}

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  previewCards?: GuidePreviewCard[];
  /** Theme property overrides (camelCase keys matching the Theme interface) used by ThemeProvider */
  themeOverrides?: Record<string, string>;
  /** Curated CSS variable names to values, displayed in the code block view */
  cssVariables?: Record<string, string>;
}

export interface GuideExample {
  id: string;
  title: string;
  description: string;
  summary: string;
  goalTheme?: Record<string, string>;
  /** Default CSS variable values before any guide step is applied (base theme). */
  defaultCssVariables?: Record<string, string>;
  steps: GuideStep[];
}

// ---------------------------------------------------------------------------
// Customizing OpenUI – theme values
// ---------------------------------------------------------------------------

const POPPINS = '"Poppins", sans-serif';
const CODE_FONT = '"SFMono-Regular", Menlo, monospace';

const toPx = (v: number): string => (v === 0 ? "0" : `${Math.round(v * 100) / 100}px`);

function buildTypography(family: string): Record<string, string> {
  return {
    fontBody: family,
    fontHeading: family,
    fontLabel: family,
    fontNumbers: family,
    fontCode: CODE_FONT,
    textBodyXs: `400 12px/1.5 ${family}`,
    textBodyXsHeavy: `500 12px/1.5 ${family}`,
    textBodySm: `400 14px/1.5 ${family}`,
    textBodySmHeavy: `500 14px/1.5 ${family}`,
    textBodyDefault: `400 16px/1.5 ${family}`,
    textBodyDefaultHeavy: `500 16px/1.5 ${family}`,
    textBodyLg: `400 18px/1.5 ${family}`,
    textBodyLgHeavy: `500 18px/1.5 ${family}`,
    textHeadingXs: `600 16px/1.25 ${family}`,
    textHeadingSm: `600 18px/1.25 ${family}`,
    textHeadingMd: `600 24px/1.1 ${family}`,
    textHeadingLg: `600 28px/1.1 ${family}`,
    textHeadingXl: `700 32px/1.1 ${family}`,
    textLabelXs: `400 12px/1.25 ${family}`,
    textLabelXsHeavy: `500 12px/1.25 ${family}`,
    textLabelSm: `400 14px/1.25 ${family}`,
    textLabelSmHeavy: `500 14px/1.25 ${family}`,
    textLabelDefault: `400 16px/1.25 ${family}`,
    textLabelDefaultHeavy: `500 16px/1.25 ${family}`,
    textLabelLg: `400 18px/1.25 ${family}`,
    textLabelLgHeavy: `500 18px/1.25 ${family}`,
    textNumbersXs: `400 12px/1.5 ${family}`,
    textNumbersXsHeavy: `500 12px/1.5 ${family}`,
    textNumbersSm: `400 14px/1.5 ${family}`,
    textNumbersSmHeavy: `500 14px/1.5 ${family}`,
    textNumbersDefault: `400 16px/1.5 ${family}`,
    textNumbersDefaultHeavy: `500 16px/1.5 ${family}`,
    textNumbersLg: `400 18px/1.5 ${family}`,
    textNumbersLgHeavy: `500 18px/1.5 ${family}`,
    textCodeSm: `400 12px/1.5 ${CODE_FONT}`,
    textCodeSmHeavy: `700 12px/1.5 ${CODE_FONT}`,
    textCodeDefault: `400 14px/1.5 ${CODE_FONT}`,
    textCodeDefaultHeavy: `700 14px/1.5 ${CODE_FONT}`,
  };
}

// Step 1 – accent color (purple swatch)
const ACCENT_OVERRIDES: Record<string, string> = {
  interactiveAccentDefault: "oklch(0.558 0.252 302.321 / 1)",
  interactiveAccentHover: "oklch(0.558 0.252 302.321 / 0.82)",
  interactiveAccentPressed: "oklch(0.496 0.237 301.924 / 1)",
  interactiveAccentDisabled: "oklch(0.558 0.252 302.321 / 0.45)",
  textBrand: "oklch(0.558 0.252 302.321 / 1)",
  textAccentPrimary: "oklch(0.994 0.001 106.423 / 1)",
  textAccentSecondary: "oklch(0.994 0.001 106.423 / 0.6)",
  borderAccent: "oklch(0.558 0.252 302.321 / 0.16)",
  borderAccentEmphasis: "oklch(0.558 0.252 302.321 / 0.32)",
};

const ACCENT_CSS: Record<string, string> = {
  "--openui-interactive-accent-default": "oklch(0.558 0.252 302.321 / 1)",
  "--openui-interactive-accent-hover": "oklch(0.558 0.252 302.321 / 0.82)",
  "--openui-interactive-accent-pressed": "oklch(0.496 0.237 301.924 / 1)",
  "--openui-interactive-accent-disabled": "oklch(0.558 0.252 302.321 / 0.45)",
  "--openui-text-brand": "oklch(0.558 0.252 302.321 / 1)",
  "--openui-text-accent-primary": "oklch(0.994 0.001 106.423 / 1)",
  "--openui-border-accent": "oklch(0.558 0.252 302.321 / 0.16)",
  "--openui-border-accent-emphasis": "oklch(0.558 0.252 302.321 / 0.32)",
};

// Step 2 – base color (stone swatch)
const BASE_OVERRIDES: Record<string, string> = {
  background: "oklch(0.97 0.001 106.424 / 1)",
  foreground: "oklch(0.994 0.001 106.423 / 1)",
  popoverBackground: "oklch(0.994 0.001 106.423 / 1)",
  sunkLight: "oklch(0.108 0.005 71.346 / 0.02)",
  sunk: "oklch(0.108 0.005 71.346 / 0.04)",
  highlightSubtle: "oklch(0.108 0.005 71.346 / 0.02)",
  highlight: "oklch(0.108 0.005 71.346 / 0.04)",
  highlightStrong: "oklch(0.108 0.005 71.346 / 0.08)",
  textNeutralPrimary: "oklch(0.108 0.005 71.346 / 1)",
  textNeutralSecondary: "oklch(0.108 0.005 71.346 / 0.6)",
  textNeutralTertiary: "oklch(0.108 0.005 71.346 / 0.35)",
  borderDefault: "oklch(0.108 0.005 71.346 / 0.08)",
  borderInteractive: "oklch(0.108 0.005 71.346 / 0.14)",
  borderInteractiveEmphasis: "oklch(0.108 0.005 71.346 / 0.28)",
};

const BASE_CSS: Record<string, string> = {
  "--openui-background": "oklch(0.97 0.001 106.424 / 1)",
  "--openui-foreground": "oklch(0.994 0.001 106.423 / 1)",
  "--openui-popover-background": "oklch(0.994 0.001 106.423 / 1)",
  "--openui-sunk-light": "oklch(0.108 0.005 71.346 / 0.02)",
  "--openui-sunk": "oklch(0.108 0.005 71.346 / 0.04)",
  "--openui-highlight-subtle": "oklch(0.108 0.005 71.346 / 0.02)",
  "--openui-highlight": "oklch(0.108 0.005 71.346 / 0.04)",
  "--openui-highlight-strong": "oklch(0.108 0.005 71.346 / 0.08)",
  "--openui-text-neutral-primary": "oklch(0.108 0.005 71.346 / 1)",
  "--openui-text-neutral-secondary": "oklch(0.108 0.005 71.346 / 0.6)",
  "--openui-text-neutral-tertiary": "oklch(0.108 0.005 71.346 / 0.35)",
  "--openui-border-default": "oklch(0.108 0.005 71.346 / 0.08)",
  "--openui-border-interactive": "oklch(0.108 0.005 71.346 / 0.14)",
  "--openui-border-interactive-emphasis": "oklch(0.108 0.005 71.346 / 0.28)",
};

// Step 3 – font (Poppins)
const FONT_OVERRIDES = buildTypography(POPPINS);

const FONT_CSS: Record<string, string> = {
  "--openui-font-body": POPPINS,
  "--openui-font-heading": POPPINS,
  "--openui-font-label": POPPINS,
  "--openui-font-numbers": POPPINS,
};

// Step 4 – heading style (heavier weights)
const HEADING_OVERRIDES: Record<string, string> = {
  textHeadingXs: `700 16px/1.2 ${POPPINS}`,
  textHeadingSm: `700 18px/1.2 ${POPPINS}`,
  textHeadingMd: `700 24px/1.1 ${POPPINS}`,
  textHeadingLg: `700 28px/1.05 ${POPPINS}`,
  textHeadingXl: `800 32px/1.05 ${POPPINS}`,
};

const HEADING_CSS: Record<string, string> = {
  "--openui-text-heading-xs": `700 16px/1.2 ${POPPINS}`,
  "--openui-text-heading-sm": `700 18px/1.2 ${POPPINS}`,
  "--openui-text-heading-md": `700 24px/1.1 ${POPPINS}`,
  "--openui-text-heading-lg": `700 28px/1.05 ${POPPINS}`,
  "--openui-text-heading-xl": `800 32px/1.05 ${POPPINS}`,
};

// Step 5 – radius (larger, base 2.5)
const RADIUS_BASE = 2.5;

const RADIUS_OVERRIDES: Record<string, string> = {
  radiusNone: "0",
  radius3xs: toPx(RADIUS_BASE * 0.5),
  radius2xs: toPx(RADIUS_BASE * 1),
  radiusXs: toPx(RADIUS_BASE * 2),
  radiusS: toPx(RADIUS_BASE * 3),
  radiusM: toPx(RADIUS_BASE * 4),
  radiusL: toPx(RADIUS_BASE * 5),
  radiusXl: toPx(RADIUS_BASE * 6),
  radius2xl: toPx(RADIUS_BASE * 7),
  radius3xl: toPx(RADIUS_BASE * 8),
  radius4xl: toPx(RADIUS_BASE * 10),
  radius5xl: toPx(RADIUS_BASE * 12),
  radius6xl: toPx(RADIUS_BASE * 14),
  radius7xl: toPx(RADIUS_BASE * 16),
  radius8xl: toPx(RADIUS_BASE * 20),
  radius9xl: toPx(RADIUS_BASE * 24),
  radiusFull: "9999px",
};

const RADIUS_CSS: Record<string, string> = {
  "--openui-radius-3xs": toPx(RADIUS_BASE * 0.5),
  "--openui-radius-2xs": toPx(RADIUS_BASE * 1),
  "--openui-radius-xs": toPx(RADIUS_BASE * 2),
  "--openui-radius-s": toPx(RADIUS_BASE * 3),
  "--openui-radius-m": toPx(RADIUS_BASE * 4),
  "--openui-radius-l": toPx(RADIUS_BASE * 5),
  "--openui-radius-xl": toPx(RADIUS_BASE * 6),
  "--openui-radius-2xl": toPx(RADIUS_BASE * 7),
  "--openui-radius-3xl": toPx(RADIUS_BASE * 8),
  "--openui-radius-full": "9999px",
};

// Step 6 – spacing (comfortable, multiplier 1.2)
const SPACING_BASE = 2 * 1.2;

const SPACING_OVERRIDES: Record<string, string> = {
  space000: "0",
  space3xs: toPx(SPACING_BASE * 1),
  space2xs: toPx(SPACING_BASE * 2),
  spaceXs: toPx(SPACING_BASE * 3),
  spaceS: toPx(SPACING_BASE * 4),
  spaceSM: toPx(SPACING_BASE * 5),
  spaceM: toPx(SPACING_BASE * 6),
  spaceML: toPx(SPACING_BASE * 8),
  spaceL: toPx(SPACING_BASE * 9),
  spaceXl: toPx(SPACING_BASE * 12),
  space2xl: toPx(SPACING_BASE * 18),
  space3xl: toPx(SPACING_BASE * 24),
};

const SPACING_CSS: Record<string, string> = {
  "--openui-space-3xs": toPx(SPACING_BASE * 1),
  "--openui-space-2xs": toPx(SPACING_BASE * 2),
  "--openui-space-xs": toPx(SPACING_BASE * 3),
  "--openui-space-s": toPx(SPACING_BASE * 4),
  "--openui-space-s-m": toPx(SPACING_BASE * 5),
  "--openui-space-m": toPx(SPACING_BASE * 6),
  "--openui-space-m-l": toPx(SPACING_BASE * 8),
  "--openui-space-l": toPx(SPACING_BASE * 9),
  "--openui-space-xl": toPx(SPACING_BASE * 12),
  "--openui-space-2xl": toPx(SPACING_BASE * 18),
  "--openui-space-3xl": toPx(SPACING_BASE * 24),
};

// ---------------------------------------------------------------------------
// Examples
// ---------------------------------------------------------------------------

const CUSTOMIZING_STEPS: GuideStep[] = [
  {
    id: "set-accent-color",
    title: "Set the accent color",
    description:
      "Start by updating the accent color to match the highlight tone in the goal preview. This immediately brings buttons and interactive states closer to the target style.",
    themeOverrides: ACCENT_OVERRIDES,
    cssVariables: ACCENT_CSS,
  },
  {
    id: "align-base-color",
    title: "Align the base color",
    description:
      "Next, adjust the base color to mirror the background tone in the goal and create a cohesive visual foundation.",
    themeOverrides: BASE_OVERRIDES,
    cssVariables: BASE_CSS,
  },
  {
    id: "update-font",
    title: "Update the body font",
    description:
      "Now update the primary body font so paragraphs and labels reflect the intended style and readability.",
    themeOverrides: FONT_OVERRIDES,
    cssVariables: FONT_CSS,
  },
  {
    id: "match-heading-style",
    title: "Match the heading style",
    description:
      "Finally, update the heading style to match the stronger hierarchy in the goal and give the interface its intended personality.",
    themeOverrides: HEADING_OVERRIDES,
    cssVariables: HEADING_CSS,
  },
  {
    id: "adjust-radius",
    title: "Adjusting the radius",
    description:
      "Border radius controls the roundness of corners across the UI. Increasing it gives a softer, more modern feel.",
    themeOverrides: RADIUS_OVERRIDES,
    cssVariables: RADIUS_CSS,
  },
  {
    id: "tweak-spacing",
    title: "Tweaking spacing",
    description:
      "Spacing affects how roomy or compact the interface feels. A comfortable scale gives elements more breathing room.",
    themeOverrides: SPACING_OVERRIDES,
    cssVariables: SPACING_CSS,
  },
];

const CUSTOMIZING_GOAL: Record<string, string> = CUSTOMIZING_STEPS.reduce<Record<string, string>>(
  (acc, step) => ({ ...acc, ...step.themeOverrides }),
  {},
);

const INTER = '"Inter", sans-serif';

const DEFAULT_CSS: Record<string, string> = {
  // Step 1 – accent (default: neutral-1000 solid)
  "--openui-interactive-accent-default": "oklch(0.097 0 0 / 1)",
  "--openui-interactive-accent-hover": "oklch(0.097 0 0 / 0.8)",
  "--openui-interactive-accent-pressed": "oklch(0.097 0 0 / 1)",
  "--openui-interactive-accent-disabled": "oklch(0.097 0 0 / 0.4)",
  "--openui-text-brand": "oklch(0.097 0 0 / 1)",
  "--openui-text-accent-primary": "oklch(0.994 0 89.876 / 1)",
  "--openui-border-accent": "oklch(0.097 0 0 / 0.08)",
  "--openui-border-accent-emphasis": "oklch(0.097 0 0 / 0.3)",

  // Step 2 – base (default: neutral swatch)
  "--openui-background": "oklch(0.97 0 89.876 / 1)",
  "--openui-foreground": "oklch(0.994 0 89.876 / 1)",
  "--openui-popover-background": "oklch(0.994 0 89.876 / 1)",
  "--openui-sunk-light": "oklch(0.097 0 0 / 0.02)",
  "--openui-sunk": "oklch(0.097 0 0 / 0.04)",
  "--openui-highlight-subtle": "oklch(0.097 0 0 / 0.02)",
  "--openui-highlight": "oklch(0.097 0 0 / 0.04)",
  "--openui-highlight-strong": "oklch(0.097 0 0 / 0.08)",
  "--openui-text-neutral-primary": "oklch(0.097 0 0 / 1)",
  "--openui-text-neutral-secondary": "oklch(0.097 0 0 / 0.5)",
  "--openui-text-neutral-tertiary": "oklch(0.097 0 0 / 0.2)",
  "--openui-border-default": "oklch(0.097 0 0 / 0.06)",
  "--openui-border-interactive": "oklch(0.097 0 0 / 0.12)",
  "--openui-border-interactive-emphasis": "oklch(0.097 0 0 / 0.3)",

  // Step 3 – font (default: Inter)
  "--openui-font-body": INTER,
  "--openui-font-heading": INTER,
  "--openui-font-label": INTER,
  "--openui-font-numbers": INTER,

  // Step 4 – headings (default weights)
  "--openui-text-heading-xs": `600 16px/1.25 ${INTER}`,
  "--openui-text-heading-sm": `600 18px/1.25 ${INTER}`,
  "--openui-text-heading-md": `600 24px/1.1 ${INTER}`,
  "--openui-text-heading-lg": `600 28px/1.1 ${INTER}`,
  "--openui-text-heading-xl": `700 32px/1.1 ${INTER}`,

  // Step 5 – radius (base 2)
  "--openui-radius-3xs": "1px",
  "--openui-radius-2xs": "2px",
  "--openui-radius-xs": "4px",
  "--openui-radius-s": "6px",
  "--openui-radius-m": "8px",
  "--openui-radius-l": "10px",
  "--openui-radius-xl": "12px",
  "--openui-radius-2xl": "14px",
  "--openui-radius-3xl": "16px",
  "--openui-radius-full": "9999px",

  // Step 6 – spacing (base 2, multiplier 1)
  "--openui-space-3xs": "2px",
  "--openui-space-2xs": "4px",
  "--openui-space-xs": "6px",
  "--openui-space-s": "8px",
  "--openui-space-s-m": "10px",
  "--openui-space-m": "12px",
  "--openui-space-m-l": "16px",
  "--openui-space-l": "18px",
  "--openui-space-xl": "24px",
  "--openui-space-2xl": "36px",
  "--openui-space-3xl": "48px",
};

export const GUIDE_EXAMPLES: GuideExample[] = [
  {
    id: "customizing-openui",
    title: "Customizing OpenUI",
    description: "Styling OpenUI to look like your brand",
    summary:
      "Think of this as a guided makeover. We\u2019ll start with the base OpenUI theme and gradually refine each setting until the interface mirrors the final goal.",
    goalTheme: CUSTOMIZING_GOAL,
    defaultCssVariables: DEFAULT_CSS,
    steps: CUSTOMIZING_STEPS,
  },
  {
    id: "prompt-control",
    title: "Controlling compositions",
    description: "Shaping generations and outputs with prompts",
    summary: "Compare prompt variants to guide formatting, specificity, and behavior.",
    steps: [
      {
        id: "prompt-step-1",
        title: "Define outcome, audience, and success",
        description:
          "Specify the desired outcome, target audience, and acceptance criteria so the model understands purpose, calibrates depth, and produces responses aligned with practical success.",
        previewCards: [
          {
            id: "prompt-step-1-option-1",
            title: "Clarity-first intent",
            description: "Prompt optimized for user comprehension and concise explanation.",
          },
          {
            id: "prompt-step-1-option-2",
            title: "Execution-first intent",
            description: "Prompt optimized for rapid implementation and immediate action.",
          },
        ],
      },
      {
        id: "prompt-step-2",
        title: "Constrain format, order, and length",
        description:
          "Define strict output structure, ordering, and length limits to reduce variance, improve readability, and ensure every response contains the exact sections stakeholders expect.",
        previewCards: [
          {
            id: "prompt-step-2-option-1",
            title: "Strict section template",
            description: "Require fixed sections with specific headings and ordering.",
          },
          {
            id: "prompt-step-2-option-2",
            title: "Length-bounded response",
            description: "Enforce concise output with a short summary plus action bullets.",
          },
        ],
      },
      {
        id: "prompt-step-3",
        title: "Inject domain context and hard constraints",
        description:
          "Provide domain-specific constraints, terminology, and non-negotiable rules so generated responses stay compliant, technically accurate, and consistent with product behavior and team conventions.",
        previewCards: [
          {
            id: "prompt-step-3-option-1",
            title: "Domain glossary",
            description: "Embed required terms and naming conventions for consistency.",
          },
          {
            id: "prompt-step-3-option-2",
            title: "Constraint block",
            description: "List hard restrictions the response must never violate.",
          },
        ],
      },
      {
        id: "prompt-step-4",
        title: "Set tone, depth, and reasoning transparency",
        description:
          "Set tone, depth, and rationale visibility to balance brevity with clarity, ensuring explanations feel appropriate for context while still exposing important trade-offs and assumptions.",
        previewCards: [
          {
            id: "prompt-step-4-option-1",
            title: "Teammate mode",
            description: "Friendly, practical tone with concise but complete implementation notes.",
          },
          {
            id: "prompt-step-4-option-2",
            title: "Expert mode",
            description: "Technical depth with explicit trade-offs and assumptions.",
          },
        ],
      },
      {
        id: "prompt-step-5",
        title: "Add guardrails, fallback, and iteration hooks",
        description:
          "Add fallback behavior and clarification prompts for ambiguous inputs so the model asks focused questions, avoids unsafe guesses, and iterates toward a reliable final answer.",
        previewCards: [
          {
            id: "prompt-step-5-option-1",
            title: "Fallback behavior",
            description: "Instruct safe default behavior when context is incomplete.",
          },
          {
            id: "prompt-step-5-option-2",
            title: "Clarification loop",
            description: "Prompt the model to ask targeted follow-ups before finalizing output.",
          },
        ],
      },
    ],
  },
];

export const getGuideExampleById = (exampleId: string): GuideExample | undefined =>
  GUIDE_EXAMPLES.find((example) => example.id === exampleId);

export const getNextGuideExampleId = (exampleId: string): string | undefined => {
  const index = GUIDE_EXAMPLES.findIndex((example) => example.id === exampleId);
  if (index < 0 || index >= GUIDE_EXAMPLES.length - 1) {
    return undefined;
  }
  return GUIDE_EXAMPLES[index + 1].id;
};
