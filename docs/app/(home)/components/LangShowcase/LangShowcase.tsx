"use client";

import { SITE_NAV_LINKS } from "@/lib/site-nav-links";
import { ArrowUpRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BevelButton } from "../Button/BevelButton";
import { FadedDither } from "../FadedDither/FadedDither";
import styles from "./LangShowcase.module.css";

/* The "framework for agent-driven interfaces" showcase: three agents as
   parallel panels, one open at a time. Each sits on the stages' Faded Dither,
   lightly tinted (from its Shiro; F1 from its answer's teal), and the open one shows the agent's
   answer on a white card. A panel without a recording yet shows an empty card.
   (The earlier live-HTML answers are parked in _saved/lang-showcase-live.) */

type Agent = {
  id: string;
  label: string;
  /* A Shiro mascot under /public, drawn as supplied: never recoloured. */
  mascot: string;
  mascotAlt: string;
  /* Where the panel's call to action goes, and what it says. */
  demo: string;
  cta?: string;
  /* playMs: how long the recording runs before holding its last frame. */
  answer?: { src: string; alt: string; width: number; height: number; playMs: number };
};

const AGENTS: Agent[] = [
  {
    id: "f1",
    label: "F1",
    mascot: "/homepage/shiro/shiro-f1.svg",
    mascotAlt: "Shiro in a racing helmet",
    demo: SITE_NAV_LINKS.f1Dashboard.href,
    answer: {
      src: "/homepage/agents/f1-answer.gif",
      playMs: 10920,
      alt: "The F1 agent's answer: Antonelli against Russell on points, wins and podiums, the Mercedes drivers' standings, and follow-up questions.",
      width: 1100,
      height: 1183,
    },
  },
  {
    id: "travel",
    label: "Travel",
    mascot: "/homepage/shiro/shiro-travel.svg",
    mascotAlt: "Shiro in a bucket hat",
    demo: SITE_NAV_LINKS.tripPlanner.href,
    answer: {
      src: "/homepage/agents/travel-kyoto-november.gif",
      playMs: 4680,
      alt: "The Travel agent's answer streaming in: Kyoto in November, taken slowly, with temple and garden picks and three November date windows to choose from.",
      width: 1100,
      height: 2138,
    },
  },
  {
    id: "intelligent-ui",
    label: "Intelligent UI",
    mascot: "/homepage/shiro/shiro-woodworker.svg",
    mascotAlt: "Shiro the woodworker",
    demo: SITE_NAV_LINKS.openIntelligentUiDemo.href,
    answer: {
      src: "/homepage/agents/ikea-kallax.gif",
      playMs: 14250,
      alt: "The Open Intelligent UI answer streaming in: a step-by-step KALLAX guide with an exploded drawing of the shelf, a view toggle and a slider to separate the parts.",
      width: 1100,
      height: 1200,
    },
  },
];

const HOLD_MS = 3000;

export function LangShowcase() {
  const [open, setOpen] = useState("f1");
  /* Counts openings, so a recording starts from its first frame each time its
     panel opens: the GIFs play once and hold on their last frame. */
  const [plays, setPlays] = useState(0);
  /* The recordings load only once the band is on screen, so the first one
     plays where it can be seen rather than finishing above the fold. */
  const [seen, setSeen] = useState(false);
  const [inView, setInView] = useState(false);
  /* The panels take turns on their own while the band is on screen: each
     recording plays, holds its last frame for HOLD_MS, then the next panel
     opens. Hovering pauses that; picking a panel stops it for good. */
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const startedAt = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // A panel's turn starts when it opens, or when the band first comes into view.
  useEffect(() => {
    if (seen) startedAt.current = Date.now();
  }, [seen, open, plays]);

  useEffect(() => {
    if (!auto || hovering || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const index = AGENTS.findIndex((agent) => agent.id === open);
    const turn = (AGENTS[index].answer?.playMs ?? 0) + HOLD_MS;
    const left = Math.max(HOLD_MS / 2, turn - (Date.now() - startedAt.current));
    const id = window.setTimeout(() => {
      setOpen(AGENTS[(index + 1) % AGENTS.length].id);
      setPlays((n) => n + 1);
    }, left);
    return () => window.clearTimeout(id);
  }, [auto, hovering, inView, open, plays]);

  return (
    <div
      ref={ref}
      className={styles.showcase}
      onPointerEnter={(event) => {
        // A touch has no "leave", so only a mouse pauses the rotation.
        if (event.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => setHovering(false)}
    >
      {AGENTS.map((agent) => {
        const isOpen = open === agent.id;
        return (
          <section
            key={agent.id}
            className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`.trim()}
            data-agent={agent.id}
          >
            <FadedDither band="light" className={styles.dither} />
            <span className={styles.tint} aria-hidden="true" />

            <div className={styles.headRow}>
              <button
                type="button"
                className={styles.head}
                aria-expanded={isOpen}
                aria-controls={`agent-${agent.id}`}
                onClick={() => {
                  if (isOpen) return;
                  setAuto(false);
                  setOpen(agent.id);
                  setPlays((n) => n + 1);
                }}
              >
                <Image
                  className={styles.mascot}
                  src={agent.mascot}
                  alt={agent.mascotAlt}
                  width={64}
                  height={64}
                  unoptimized
                />
                <span className={styles.label}>{agent.label}</span>
              </button>
            </div>

            <div id={`agent-${agent.id}`} className={styles.card} aria-hidden={!isOpen}>
              {seen && isOpen && agent.answer && (
                <div className={styles.answerClip}>
                  <Image
                    className={styles.answer}
                    src={
                      agent.answer.src.endsWith(".gif")
                        ? `${agent.answer.src}?play=${plays}`
                        : agent.answer.src
                    }
                    alt={agent.answer.alt}
                    width={agent.answer.width}
                    height={agent.answer.height}
                    sizes="(max-width: 767px) 80vw, 720px"
                    /* A recording plays only as the original file. */
                    unoptimized={agent.answer.src.endsWith(".gif")}
                  />
                </div>
              )}
            </div>
            {isOpen && (
              <div className={styles.demo}>
                <BevelButton
                  variant="secondary"
                  href={agent.demo}
                  label={agent.cta ?? "View demo"}
                  external
                  badge={<ArrowUpRight size={16} weight="bold" />}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
