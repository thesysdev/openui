"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import { FoldHeader } from "../../components/FoldHeader/FoldHeader";
import { LogoBubbles } from "../../components/LogoBubbles/LogoBubbles";
import { RendererChips } from "../../components/RendererChips/RendererChips";
import { stackChipStyles, type StackChipItem } from "../../components/StackChip/StackChip";
import styles from "./CompatibilitySection.module.css";

interface StackRow {
  label: string;
  /* Plain-language name and one line for the card. `label` stays the
     technical term for the hidden list and any reader who wants it. */
  title: string;
  description: string;
  items: StackChipItem[];
}

/* The four compatibility groups: the model, the agent code that calls it, the
   components it renders with, and the app the user touches. Each becomes one
   card, in this order.

   Every entry needs a real mark. Anything with no logo to be found is left out
   rather than stood in for by a related company's. */
const STACK_ROWS: StackRow[] = [
  {
    /* OpenAI, xAI and DeepSeek are local files: Simple Icons carries no OpenAI
       mark, and its "x" is the social network, not xAI. */
    label: "LLMs",
    title: "Your model",
    description: "Closed or open, hosted or running on your own machine.",
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
      {
        name: "Qwen",
        iconKind: "image",
        slug: "qwen",
        iconColor: "6950ef",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Ollama",
        iconKind: "image",
        slug: "ollama",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
    ],
  },
  {
    /* Llama, LlamaIndex and Mastra are absent: no logo could be found for any of
       them, and a row is better short than wrong. */
    label: "Backend",
    title: "Your agents",
    description: "Add it to your existing agent code. No rewrite needed.",
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
      {
        name: "CrewAI",
        iconKind: "image",
        slug: "crewai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeCrewAi,
      },
      {
        name: "n8n",
        iconKind: "image",
        slug: "n8n",
        iconColor: "ea4b71",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Haystack",
        iconKind: "image",
        slug: "haystack",
        iconColor: "0eaf9c",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
    ],
  },
  {
    label: "UI library",
    title: "Your components",
    description: "Bring your own design system and component library.",
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
    title: "Your framework",
    description: "Works in the web framework you build with today.",
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
      {
        name: "Astro",
        iconKind: "image",
        slug: "astro",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
    ],
  },
];

/* Four cards in plain words rather than the stack diagram: what each group
   means to someone choosing a tool, then the logos that prove it. */
export function CompatibilitySection() {
  return (
    <section className={styles.section} aria-labelledby="integrations-title">
      <FoldHeader
        id="integrations-title"
        title="Works with the tools you already use."
        subtitle={
          <>
            Keep your model, your agent code and your design system. One spec renders natively
            in <RendererChips /> and more.
          </>
        }
      >
        <div className={styles.headerCta}>
          <BevelButton
            variant="primary"
            href="/docs/integrations"
            label="View integrations"
            badge={<ArrowRight size={16} weight="bold" />}
          />
        </div>
      </FoldHeader>
      <div className={styles.container}>
        <ul className={styles.cards}>
          {STACK_ROWS.map((row, index) => (
            <li key={row.label} className={styles.card}>
              {/* Logos lead each column as its picture. */}
              <LogoBubbles items={row.items} stagger={index} />
              <h3 className={styles.cardTitle}>{row.title}</h3>
              <p className={styles.cardDescription}>{row.description}</p>
              {/* The names stay for screen readers; the logos carry them visually. */}
              <p className="sr-only">{row.items.map((item) => item.name).join(", ")}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
