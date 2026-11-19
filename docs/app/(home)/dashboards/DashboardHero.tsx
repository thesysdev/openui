"use client";

import { ArrowUp, Pause, Play, User, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { FadedDither } from "../components/FadedDither/FadedDither";
import {
  type ProofItem,
  RendererProofLine,
} from "../components/RendererProofLine/RendererProofLine";
import tabStyles from "../components/StreamingComparison/StreamingComparison.module.css";
import styles from "./DashboardHero.module.css";
import { SCENES, useLoop } from "./HeroScenes";
import { focus, pop } from "./story/motion";

/* The models beside the hero CTAs, in the homepage's "rendered in" line. */
const MODELS: ProofItem[] = [
  { name: "Anthropic", logo: "/brand-icons/anthropic.svg", shimmer: "#d97757" },
  { name: "Gemini", logo: "/brand-icons/gemini.svg", shimmer: "#4285f4" },
  { name: "OpenAI", logo: "/brand-icons/openai.svg", shimmer: "#10a37f", large: true },
  { name: "DeepSeek", logo: "/brand-icons/deepseek.svg", shimmer: "#4d6bfe" },
];

export function ModelProof() {
  return (
    <RendererProofLine
      lead="Generate with"
      items={MODELS}
      href="/cloud/gateway/models"
      more="and hundreds more"
      logosOnly
    />
  );
}

/* ---------- Hero: four use cases, each where it lives in a product ---------- */

const CASES = [
  {
    id: "finance",
    label: "Finance",
    form: "chat",
    notch: "Your agent",
    where: "as an answer in chat",
  },
  { id: "sales", label: "Sales", form: "page", notch: "Your app", where: "as a dashboard page" },
  {
    id: "support",
    label: "Support",
    form: "copilot",
    notch: "Your copilot",
    where: "beside a copilot",
  },
  {
    id: "logistics",
    label: "Logistics",
    form: "mobile",
    notch: "Your app",
    where: "in a mobile app",
  },
] as const;

/* A turn in the copilot thread: who is speaking, in small caps above the
   bubble, in place of an avatar. */
function Said({
  who,
  style,
  children,
}: {
  who: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className={styles.said} style={style}>
      <span className={styles.saidWho}>{who}</span>
      {children}
    </span>
  );
}

/* The user's question, drawn like the homepage comparison's prompt: a plain
   tinted bubble. */
function Ask({
  text,
  style,
  avatar = false,
}: {
  text: string;
  style?: CSSProperties;
  /* A user avatar to the bubble's left. */
  avatar?: boolean;
}) {
  if (!avatar)
    return (
      <span className={styles.ask} style={style}>
        {text}
      </span>
    );
  return (
    <span className={styles.askRow} style={style}>
      <i>
        <User />
      </i>
      <span className={styles.ask}>{text}</span>
    </span>
  );
}

/* The assistant's answer: a white bubble on a hairline. */
function Reply({ text }: { text: string }) {
  return <span className={styles.reply}>{text}</span>;
}

export function DashboardHeroStage() {
  const host = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const item = CASES[active];
  const go = (index: number) => {
    setActive(index);
    // On narrow screens the tab row scrolls; bring the opened tab to the middle.
    const tab = tabRefs.current[index];
    const row = tab?.parentElement;
    if (tab && row && row.scrollWidth > row.clientWidth)
      row.scrollTo({
        left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
        behavior: "smooth",
      });
  };
  const T = useLoop(item.id, host);
  const Scene = SCENES[item.id];
  const notch = <span className={styles.notch}>{item.notch}</span>;
  return (
    <div
      ref={host}
      className={tabStyles.tabsHost}
      // The active tab's fill drives rotation; pausing holds it.
      style={{ "--tab-fill-play": paused ? "paused" : "running" } as CSSProperties}
    >
      <div
        className={`${gatewayStyles.heroArtSpace} ${styles.stage}`}
        role="img"
        aria-label={`A live ${item.label.toLowerCase()} dashboard built from the product's own components, shown ${item.where}`}
      >
        <FadedDither band="light" className={gatewayStyles.heroShader} />
        <div className={gatewayStyles.heroArtwork}>
          <div className={styles.scene} data-form={item.form} aria-hidden="true">
            {item.form === "mobile" ? (
              <div className={styles.phone}>
                <div className={styles.phoneScreen}>
                  {notch}
                  <Scene
                    T={T}
                    ask={<Ask text="How are deliveries doing today?" style={pop(T, 0.05)} avatar />}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.device}>
                <div className={styles.screen}>
                  {notch}
                  {item.form === "page" ? <Scene T={T} /> : null}
                  {item.form === "copilot" ? (
                    <div className={styles.split}>
                      <div className={styles.pane}>
                        <Scene T={T} />
                      </div>
                      <aside className={styles.copilot}>
                        <span className={styles.copilotHead}>
                          Copilot
                          <X />
                        </span>
                        <div className={styles.thread}>
                          <Said who="User" style={pop(T, 0.2)}>
                            <Ask text="Where are we missing SLA?" />
                          </Said>
                          <Said who="Assistant" style={focus(T, 0.55)}>
                            <Reply text="Mostly urgent billing tickets after 6 pm. I added them to your board." />
                          </Said>
                        </div>
                        <span className={styles.composer}>
                          Ask for a change
                          <i>
                            <ArrowUp />
                          </i>
                        </span>
                      </aside>
                    </div>
                  ) : null}
                  {item.form === "chat" ? (
                    <>
                      <div className={styles.turn}>
                        <Ask
                          text="How are we tracking against budget this quarter?"
                          style={pop(T, 0.05)}
                          avatar
                        />
                      </div>
                      <div className={styles.answer}>
                        <Scene T={Math.max(0, T - 0.5)} />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* The homepage comparison's toggle: stops the tabs rotating, while the
          open scene keeps playing. */}
      <button
        type="button"
        className={`${tabStyles.playToggle} ${styles.playToggle}`}
        aria-label={paused ? "Resume rotating the use cases" : "Stop rotating the use cases"}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? (
          <Play size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
        ) : (
          <Pause size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
        )}
      </button>
      <div className={`${tabStyles.tabsBar} ${styles.tabsBar}`}>
        <div className={tabStyles.tabs} role="tablist" aria-label="Use cases">
          {CASES.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              ref={(node) => {
                tabRefs.current[i] = node;
              }}
              className={`${tabStyles.tab} ${i === active ? tabStyles.tabActive : ""}`.trim()}
              onClick={() => go(i)}
              // The active tab's fill (the only animation on these buttons) ran out.
              onAnimationEnd={() => go((i + 1) % CASES.length)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
