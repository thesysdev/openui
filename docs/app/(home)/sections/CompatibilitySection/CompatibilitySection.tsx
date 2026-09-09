"use client";

import svgPaths from "@/imports/svg-urruvoh2be";
import { stackChipStyles, type StackChipItem } from "../../components/StackChip/StackChip";
import { CompatibilityDiagram } from "./CompatibilityDiagram";
import styles from "./CompatibilitySection.module.css";

interface StackRow {
  label: string;
  items: StackChipItem[];
}

/* Keep the four existing compatibility groups and their supported integrations
   together; every branch uses this same source at every screen size. */
const STACK_ROWS: StackRow[] = [
  {
    label: "LLM",
    items: [
      {
        name: "OpenAI",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
      {
        name: "Gemini",
        iconKind: "image",
        slug: "googlegemini",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Mistral",
        iconKind: "image",
        slug: "mistralai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMistral,
      },
      {
        name: "xAI",
        iconKind: "image",
        localSrc: "/brand-icons/xai.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "DeepSeek",
        iconKind: "image",
        localSrc: "/brand-icons/deepseek.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeDeepSeek,
      },
    ],
  },
  {
    label: "Backend",
    items: [
      {
        name: "Cursor",
        iconKind: "image",
        localSrc: "/brand-icons/cursor.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "LangChain",
        iconKind: "image",
        slug: "langchain",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeLangChain,
      },
      {
        name: "CrewAI",
        iconKind: "image",
        slug: "crewai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeCrewAi,
      },
      {
        name: "OpenAI Agents SDK",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic Agents SDK",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
    ],
  },
  {
    /* Where it renders. Every entry is a package we publish (react-lang,
       vue-lang, svelte-lang, react-email) or a listed integration — no Flutter
       and no direct native, which A2UI has and we do not. */
    label: "Client",
    items: [
      {
        name: "React",
        iconKind: "image",
        slug: "react",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Vue",
        iconKind: "image",
        slug: "vuedotjs",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Svelte",
        iconKind: "image",
        slug: "svelte",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "React Native",
        iconKind: "image",
        slug: "react",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Lynx",
        iconKind: "image",
        localSrc: "/integration-logos/lynx.svg",
        iconColor: "ffffff",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Email",
        iconKind: "text",
        iconText: "@",
        badgeClassName: stackChipStyles.badgeBlack,
      },
    ],
  },
  {
    label: "Design library",
    items: [
      {
        name: "OpenUI Design system",
        iconKind: "mascot",
        badgeClassName: stackChipStyles.badgeOpenUi,
      },
      {
        name: "ShadCN",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeBlack,
        iconViewBox: "0 0 24 24",
        iconPath: svgPaths.p46a4800,
        iconFill: "white",
        clipId: "clip_shadcn",
        clipSize: "24",
      },
      {
        name: "Material Design system",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeMaterial,
        iconViewBox: "0 0 30 30",
        iconPath: svgPaths.p3a7bdd80,
        iconFill: "white",
        clipId: "clip_material",
        clipSize: "30",
      },
      {
        name: "DaisyUI",
        iconKind: "text",
        iconText: "D",
        badgeClassName: stackChipStyles.badgeDaisyUi,
      },
      {
        name: "Base UI",
        iconKind: "text",
        iconText: "B",
        badgeClassName: stackChipStyles.badgeBaseUi,
      },
    ],
  },
];

export function CompatibilitySection({ embedded = false }: { embedded?: boolean } = {}) {
  return (
    <section
      className={styles.section}
      data-variant={embedded ? "embedded" : undefined}
      aria-labelledby="favorite-stack-title"
    >
      <div className={styles.container}>
        <div className={styles.stack}>
          <CompatibilityDiagram groups={STACK_ROWS} />
        </div>
      </div>
    </section>
  );
}
