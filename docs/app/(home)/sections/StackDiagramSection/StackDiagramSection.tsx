"use client";

import {
  ArrowRight,
  Brain,
  Browser,
  ChatText,
  Play,
  TreeStructure,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/button";

import { BevelButton } from "../../components/Button/BevelButton";
import { stackChipStyles } from "../../components/StackChip/StackChip";
import styles from "./StackDiagramSection.module.css";

/* A "Works with" mark renders one of three ways: a circular brand badge (the
   same chip CompatibilitySection uses), a wordmark with dark/white cuts that
   CSS swaps per theme, or plain text where a mark would not survive shrinking.
   Marks are sourced like CompatibilitySection: local files for what we ship,
   simpleicons CDN for the rest. */
type WorksWithMark =
  | { name: string; src: string; badge: string }
  | { name: string; base: string; height: number }
  | { name: string; text: string };

function WorksWith({ marks }: { marks: WorksWithMark[] }) {
  return (
    <div className={styles.panelWorks}>
      <p className={styles.panelWorksLabel}>Works with</p>
      <div className={styles.panelWorksLogos}>
        {marks.map((mark) => {
          if ("text" in mark) {
            return (
              <span key={mark.name} className={styles.wordmarkText}>
                {mark.text}
              </span>
            );
          }
          if ("base" in mark) {
            return (
              <span key={mark.name} className={styles.wordmark}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.wordmarkDark}
                  src={`${mark.base}-dark.svg`}
                  alt={mark.name}
                  title={mark.name}
                  style={{ height: mark.height }}
                  loading="lazy"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.wordmarkWhite}
                  src={`${mark.base}-white.svg`}
                  alt=""
                  aria-hidden="true"
                  style={{ height: mark.height }}
                  loading="lazy"
                />
              </span>
            );
          }
          return (
            <span key={mark.name} className={`${stackChipStyles.badge} ${mark.badge}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={stackChipStyles.badgeImage}
                src={mark.src}
                alt={mark.name}
                title={mark.name}
                width={16}
                height={16}
                loading="lazy"
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

const LLM_BADGES: WorksWithMark[] = [
  {
    name: "OpenAI",
    src: "/brand-icons/openai.svg",
    badge: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
  },
  {
    name: "Anthropic",
    src: "https://cdn.simpleicons.org/anthropic/ffffff",
    badge: stackChipStyles.badgeAnthropic,
  },
  {
    name: "Gemini",
    src: "https://cdn.simpleicons.org/googlegemini/000000",
    badge: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
  },
  {
    name: "Mistral",
    src: "https://cdn.simpleicons.org/mistralai/ffffff",
    badge: stackChipStyles.badgeMistral,
  },
  { name: "xAI", src: "/brand-icons/xai.svg", badge: stackChipStyles.badgeBlack },
  { name: "DeepSeek", src: "/brand-icons/deepseek.svg", badge: stackChipStyles.badgeDeepSeek },
];

const APP_SURFACE_MARKS: WorksWithMark[] = [
  /* CopilotKit's glyph does not survive shrinking, so it is set as text. */
  { name: "CopilotKit", text: "CopilotKit 🪁" },
  { name: "Assistant UI", base: "/brand-icons/assistant-ui", height: 16 },
];

const UI_LIBRARY_BADGES: WorksWithMark[] = [
  {
    name: "ShadCN",
    src: "https://cdn.simpleicons.org/shadcnui/ffffff",
    badge: stackChipStyles.badgeBlack,
  },
  {
    name: "Material Design",
    src: "https://cdn.simpleicons.org/materialdesign/ffffff",
    badge: stackChipStyles.badgeMaterial,
  },
  {
    name: "DaisyUI",
    src: "https://cdn.simpleicons.org/daisyui/ffffff",
    badge: stackChipStyles.badgeDaisyUi,
  },
  {
    name: "Radix UI",
    src: "https://cdn.simpleicons.org/radixui/ffffff",
    badge: stackChipStyles.badgeBlack,
  },
];

const FRAMEWORK_BADGES: WorksWithMark[] = [
  {
    name: "Vercel AI SDK",
    src: "https://cdn.simpleicons.org/vercel/ffffff",
    badge: stackChipStyles.badgeBlack,
  },
  {
    name: "LangChain",
    src: "https://cdn.simpleicons.org/langchain/ffffff",
    badge: stackChipStyles.badgeLangChain,
  },
  {
    name: "CrewAI",
    src: "https://cdn.simpleicons.org/crewai/ffffff",
    badge: stackChipStyles.badgeCrewAi,
  },
];
type LayerId = "application" | "rendering" | "lang" | "backend" | "model";

const DESCRIPTIONS: Record<
  LayerId,
  {
    title: string;
    description: string;

    cloudLabel?: string;
    cloud: string[];
    docsHref: string;
    ctaLabel?: string;
    worksWith?: WorksWithMark[];
  }
> = {
  application: {
    title: "What your users interact with",
    description:
      "Integrate in your existing app surface or start with a production-grade starter template.",
    cloudLabel: "With OpenUI Cloud you can generate",
    cloud: ["Reports", "Slides", "Dashboards"],
    docsHref: "/docs/agent/getting-started/introduction",
    ctaLabel: "Agent Interface",
    worksWith: APP_SURFACE_MARKS,
  },
  rendering: {
    title: "Render your UI components",
    description:
      "The runtime renders with our open-source OpenUI library, ShadCN, Material, or your own components.",
    cloud: ["Advanced UI library", "Responsive UI", "Production-grade rendering"],
    docsHref: "/docs/agent/core-concepts/generative-ui",
    worksWith: UI_LIBRARY_BADGES,
  },
  lang: {
    title: "Connect models to UI",
    description:
      "A streaming protocol between your model and the UI runtime. 3x faster and consumes 67% fewer tokens.",
    cloud: ["Output validation", "Automatic correction"],
    docsHref: "/docs/openui-lang",
  },
  backend: {
    title: "Bring your agent backend",
    description: "Use any framework, tools, APIs, and data sources.",
    cloud: ["Data persistence", "Reliability", "Observability", "Inbuilt tools"],
    docsHref: "/docs/agent/core-concepts/tools",
    worksWith: FRAMEWORK_BADGES,
  },
  model: {
    title: "Use any model",
    description: "Generate OpenUI Lang with your preferred LLM.",
    cloud: ["One API", "Provider fallbacks"],
    docsHref: "/docs/agent/reference/adapters-and-formats",
    worksWith: LLM_BADGES,
  },
};

const ICON_SIZE = 17;

export function StackDiagramSection() {
  const [selected, setSelected] = useState<LayerId>("application");
  /* Phones have no hover, so a tap opens the description as a bottom sheet. */
  const [trayOpen, setTrayOpen] = useState(false);
  const active = DESCRIPTIONS[selected];

  const layerProps = (id: LayerId) => ({
    className: `${styles.layer} ${selected === id ? styles.layerSelected : ""}`,
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": selected === id,
    /* Hover drives the panel. Focus mirrors it for keyboard users, and click
       stays so touch devices (which never hover) can still switch layers. */
    /* Pointer devices only: a tap on a phone also fires mouseenter, and there
       the tray is the interaction. */
    onMouseEnter: () => {
      if (window.matchMedia("(hover: hover)").matches) setSelected(id);
    },
    onFocus: () => setSelected(id),
    onClick: () => {
      setSelected(id);
      setTrayOpen(true);
    },
  });

  return (
    <section className={styles.section} aria-labelledby="stack-diagram-title">
      <div className={styles.container}>
        <div className={styles.diagram}>
          <div className={styles.group}>
            <div className={styles.chip}>
              <span>Agentic Frontend</span>
            </div>
            <div {...layerProps("application")}>
              <div className={`${styles.content} ${styles.contentSplit}`}>
                <div className={styles.item}>
                  <span className={styles.itemIcon}>
                    <Browser size={ICON_SIZE} />
                  </span>
                  <span className={styles.itemTitle}>Agent Interface</span>
                </div>
                <span className={styles.layerArrow}>
                  <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>

            <div {...layerProps("rendering")}>
              <div className={`${styles.content} ${styles.contentSplit}`}>
                <div className={styles.item}>
                  <span className={styles.itemIcon}>
                    <Play size={ICON_SIZE} />
                  </span>
                  <span className={styles.itemTitle}>OpenUI Runtime</span>
                </div>
                <span className={styles.layerArrow}>
                  <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>
          </div>

          <div className={styles.connector}>
            {/* Four lanes: the left pair streams UI up, the right pair carries
                actions down. */}
            <span className={styles.rails}>
              <Rail direction="up" />
              <Rail direction="up" />
              <Rail direction="down" />
              <Rail direction="down" />
            </span>
            <div className={styles.langLayer}>
              <div
                {...layerProps("lang")}
                className={`${styles.layer} ${selected === "lang" ? styles.layerSelected : ""}`}
              >
                <div className={`${styles.content} ${styles.contentSingle}`}>
                  <div className={styles.item}>
                    <span className={styles.itemIcon}>
                      <ChatText size={ICON_SIZE} />
                    </span>
                    <span className={styles.itemTitle}>OpenUI Lang</span>
                  </div>
                  <span className={styles.layerArrow}>
                    <ArrowRight size={12} weight="bold" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.chip}>
              <span>Agentic Backend</span>
            </div>
            <div {...layerProps("backend")}>
              <div className={`${styles.content} ${styles.contentSplit}`}>
                <div className={styles.item}>
                  <span className={styles.itemIcon}>
                    <TreeStructure size={ICON_SIZE} />
                  </span>
                  <span className={styles.itemTitle}>Orchestration &amp; Tools</span>
                </div>
                <span className={styles.layerArrow}>
                  <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>

            <div {...layerProps("model")}>
              <div className={`${styles.content} ${styles.contentSplit}`}>
                <div className={styles.item}>
                  <span className={styles.itemIcon}>
                    <Brain size={ICON_SIZE} />
                  </span>
                  <span className={styles.itemTitle}>LLMs</span>
                </div>
                <span className={styles.layerArrow}>
                  <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`${styles.trayBackdrop} ${trayOpen ? styles.trayBackdropOpen : ""}`}
          onClick={() => setTrayOpen(false)}
          aria-hidden="true"
        />

        <aside className={`${styles.panel} ${trayOpen ? styles.panelOpen : ""}`}>
          <button
            type="button"
            className={styles.trayClose}
            onClick={() => setTrayOpen(false)}
            aria-label="Close details"
          >
            <X size={16} weight="bold" />
          </button>

          <div key={selected} className={styles.panelInner}>
            <h2 id="stack-diagram-title" className={styles.panelTitle}>
              {active.title}
            </h2>
            <p className={styles.panelBody}>{active.description}</p>

            {/* Tertiary inline on desktop; a full-width primary at the foot of the
              mobile tray. Both are rendered and CSS shows the one in play. */}
            <div className={styles.panelCta}>
              <span className={styles.ctaInline}>
                <Button
                  href={active.docsHref}
                  text={active.ctaLabel ?? "View Docs"}
                  variant="tertiary"
                />
              </span>
              <span className={styles.ctaBlock}>
                <BevelButton
                  variant="primary"
                  href={active.docsHref}
                  label={active.ctaLabel ?? "View Docs"}
                  badge={<ArrowRight size={16} weight="bold" />}
                />
              </span>
            </div>

            {active.worksWith && <WorksWith marks={active.worksWith} />}

            <div className={styles.panelCloud}>
              <p className={styles.panelCloudLabel}>
                {active.cloudLabel ?? "With OpenUI Cloud you get"}
              </p>
              <ul className={styles.panelCloudChips}>
                {active.cloud.map((feature) => (
                  <li key={feature} className={styles.panelCloudChip}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* A rail of chevrons travelling between the runtime card and the orchestration
   card: UI streams up the left, actions flow down the right. The track holds
   two identical halves and shifts by 50%, so the loop is seamless. */
const RAIL_CHEVRONS = 30;

function Rail({ direction }: { direction: "up" | "down" }) {
  const up = direction === "up";
  return (
    <span className={`${styles.rail} ${up ? styles.railUp : styles.railDown}`} aria-hidden="true">
      <span className={styles.railTrack}>
        {Array.from({ length: RAIL_CHEVRONS }, (_, i) => (
          <svg
            key={i}
            className={styles.chevron}
            viewBox="0 0 24 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={up ? "M3 9.5 L12 2.5 L21 9.5" : "M3 2.5 L12 9.5 L21 2.5"} />
          </svg>
        ))}
      </span>
    </span>
  );
}
