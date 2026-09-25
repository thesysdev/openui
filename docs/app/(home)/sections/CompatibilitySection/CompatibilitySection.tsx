"use client";

import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { stackChipStyles, type StackChipItem } from "../../components/StackChip/StackChip";
import { CompatibilityDiagram } from "./CompatibilityDiagram";
import styles from "./CompatibilitySection.module.css";

interface StackRow {
  label: string;
  items: StackChipItem[];
}

/* The four compatibility groups, ordered the way the stack is drawn top to
   bottom: the model at the top, then the service that calls it, the library it
   renders with, and the client the user touches at the base. The diagram draws
   one StackLayerRow per group, in this order, and runs that group's own logos
   past it.

   Every entry needs a real mark. Anything with no logo to be found is left out
   rather than stood in for by a related company's. */
const STACK_ROWS: StackRow[] = [
  {
    /* OpenAI, xAI and DeepSeek are local files: Simple Icons carries no OpenAI
       mark, and its "x" is the social network, not xAI. */
    label: "LLMs",
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
        name: "DeepSeek",
        iconKind: "image",
        localSrc: "/brand-icons/deepseek.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeDeepSeek,
      },
      {
        name: "xAI",
        iconKind: "image",
        localSrc: "/brand-icons/xai.svg",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Mistral",
        iconKind: "image",
        slug: "mistralai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMistral,
      },
    ],
  },
  {
    /* Llama, LlamaIndex and Mastra are absent: no logo could be found for any of
       them, and a row is better short than wrong. */
    label: "Backend",
    items: [
      {
        name: "Vercel AI SDK",
        iconKind: "image",
        slug: "vercel",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "LangChain",
        iconKind: "image",
        slug: "langchain",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeLangChain,
      },
      {
        name: "LangGraph",
        iconKind: "image",
        slug: "langgraph",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeLangChain,
      },
      {
        name: "Convex",
        iconKind: "image",
        slug: "convex",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeConvex,
      },
      {
        name: "Cloudflare",
        iconKind: "image",
        slug: "cloudflare",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeCloudflare,
      },
    ],
  },
  {
    label: "UI library",
    items: [
      {
        name: "OpenUI Design system",
        iconKind: "mascot",
        badgeClassName: stackChipStyles.badgeOpenUi,
      },
      {
        name: "shadcn/ui",
        iconKind: "image",
        slug: "shadcnui",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Material UI",
        iconKind: "image",
        slug: "mui",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMui,
      },
      {
        name: "Ant Design",
        iconKind: "image",
        slug: "antdesign",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAntDesign,
      },
      {
        name: "Radix UI",
        iconKind: "image",
        slug: "radixui",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Chakra UI",
        iconKind: "image",
        slug: "chakraui",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeChakra,
      },
      {
        name: "Mantine",
        iconKind: "image",
        slug: "mantine",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMantine,
      },
      {
        name: "daisyUI",
        iconKind: "image",
        slug: "daisyui",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeDaisyUi,
      },
    ],
  },
  {
    label: "Clients",
    items: [
      {
        name: "React",
        iconKind: "image",
        slug: "react",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Next.js",
        iconKind: "image",
        slug: "nextdotjs",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
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
        name: "Angular",
        iconKind: "image",
        slug: "angular",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "Nuxt",
        iconKind: "image",
        slug: "nuxt",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeNuxt,
      },
      {
        name: "Remix",
        iconKind: "image",
        slug: "remix",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
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
        {/* Sits under the diagram, reading as its caption. Same treatment as the
            benchmark header above this band, so the two read as peers, and
            titleId keeps the section's aria-labelledby valid. */}
        <div className={styles.header}>
          {/* The diagram is images and a hidden list, so the caption is what
              puts this band's claim into crawlable body text. One clause per
              row above it, in the same order. */}
          <SectionHeader
            caption="Generative UI that renders in any client framework, uses any component library, and runs on any agent backend or model."
            title="...and works with your stack."
            titleId="favorite-stack-title"
          />
        </div>
      </div>
    </section>
  );
}
