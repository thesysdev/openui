"use client";

import { ArrowRight, ArrowUp, Sparkles, User, X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useRef, useState } from "react";
import gatewayStyles from "../cloud/gateway/page.module.css";
import { FadedDither } from "../components/FadedDither/FadedDither";
import { StackChip } from "../components/StackChip/StackChip";
import tabStyles from "../components/StreamingComparison/StreamingComparison.module.css";
import { STACK_ROWS } from "../sections/CompatibilitySection/CompatibilitySection";
import styles from "./DashboardHero.module.css";
import { SCENES, useLoop } from "./HeroScenes";
import page from "./page.module.css";
import { focus, pop } from "./story/motion";

/* The model marks beside the hero CTAs, from the homepage compatibility data. */
const MODEL_MARKS = STACK_ROWS[0].items.slice(0, 4);

export function ModelProof() {
  return (
    <Link className={page.modelProof} href="/cloud/gateway/models">
      <span className={page.modelMarks} aria-hidden="true">
        {MODEL_MARKS.map((item) => (
          <span className={page.modelMark} key={item.name}>
            <StackChip item={item} iconOnly plain="fine" />
          </span>
        ))}
      </span>
      <span className={page.modelText}>
        Generate with hundreds of models
        <ArrowRight className={page.modelArrow} aria-hidden="true" />
      </span>
    </Link>
  );
}

/* ---------- Hero: four use cases, each where it lives in a product ---------- */

const CASES = [
  { id: "sales", label: "Sales", form: "page", notch: "Your app", where: "as a dashboard page" },
  {
    id: "support",
    label: "Support",
    form: "copilot",
    notch: "Your copilot",
    where: "beside a copilot",
  },
  {
    id: "finance",
    label: "Finance",
    form: "chat",
    notch: "Your agent",
    where: "as an answer in chat",
  },
  {
    id: "logistics",
    label: "Logistics",
    form: "mobile",
    notch: "Your app",
    where: "in a mobile app",
  },
] as const;

function Ask({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <span className={styles.ask} style={style}>
      <i>
        <User />
      </i>
      <span>{text}</span>
    </span>
  );
}

function Reply({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <span className={styles.reply} style={style}>
      <i>
        <Sparkles />
      </i>
      <span>{text}</span>
    </span>
  );
}

export function DashboardHeroStage() {
  const host = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
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
    <div ref={host} className={tabStyles.tabsHost}>
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
                  <Scene T={T} />
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
                          <Ask text="Where are we missing SLA this week?" style={pop(T, 0.2)} />
                          <Reply
                            text="Mostly urgent billing tickets after 6 pm. I added them to your board."
                            style={focus(T, 0.55)}
                          />
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
                        />
                        <Reply
                          text="Spend is 4% under budget, and revenue is ahead of plan."
                          style={focus(T, 0.3)}
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
