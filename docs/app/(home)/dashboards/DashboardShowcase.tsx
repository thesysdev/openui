"use client";

import { ArrowUpRight } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import bevel from "../components/Button/BevelButton.module.css";
import styles from "./DashboardShowcase.module.css";

/* The two cards under the logo strip on /dashboards: wide tiles, each tinted
   with its own accent, holding a drawn screen that replays while the pointer
   is on it. Started as a copy of the home page's LangShowcase and kept apart
   from it, so changes here never touch the home page. On a phone the tiles
   stack: one open, with its line, a Try button and its screen; a tap on
   another unfolds it. */

export type ShowcaseAgent = {
  id: string;
  label: string;
  /* The chip over the name: what kind of thing the tile shows. */
  kind?: string;
  /* The tile's tint, its chip and its name take this colour. */
  accent: string;
  /* How much of the accent the tint carries; 6% unless it reads too strong. */
  tintMix?: string;
  /* Where the tile's link goes, and what it says: "Try" unless given. */
  demo: string;
  cta?: string;
  /* One line under the name, saying what the tile is. */
  description?: string;
  /* rate: played faster than recorded, for the longer answers. */
  answer?: { src: string; alt: string; width: number; height: number; rate?: number };
  /* A drawn screen instead of a recording, for a tile that shows what the
     product is rather than an answer arriving. It has no sheet around it:
     it is laid out at its own pixel size, scaled to the tile's width and
     stuck to its bottom edge. */
  scene?: {
    node: ReactNode;
    width: number;
    height: number;
  };
};

export function DashboardShowcase({
  agents,
  square = false,
}: {
  agents: ShowcaseAgent[];
  square?: boolean;
}) {
  /* Two states and no third: every tile rests on a still of its answer, and
     the one under the pointer opens and plays. */
  const [open, setOpen] = useState<string | null>(null);
  /* Counts openings, so a recording starts from its first frame each time its
     tile opens: the recordings play once and hold on their last frame. */
  const [plays, setPlays] = useState(0);
  /* The recordings load only once the band is on screen, rather than on a
     page the reader has not reached. */
  const [seen, setSeen] = useState(false);
  /* On phones the tiles are stacked rows: one is always open, and a tap on
     another opens it instead of following its link. */
  const [stacked, setStacked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setStacked(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Stacked, the first tile is open until another is chosen. */
  const active = open ?? (stacked ? (agents[0]?.id ?? null) : null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      const frame = requestAnimationFrame(() => setSeen(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.showcase} ${square ? "" : styles.flat}`.trim()}>
      <div className={styles.track}>
        {agents.map((agent) => {
          const isOpen = active === agent.id;
          return (
            <section
              key={agent.id}
              className={[
                styles.panel,
                isOpen ? styles.panelOpen : "",
                agent.description ? styles.panelDescribed : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-agent={agent.id}
              style={
                {
                  "--accent": agent.accent,
                  "--tint-mix": agent.tintMix ?? "6%",
                } as CSSProperties
              }
              /* The tile under the pointer opens and plays from the top; it
                 falls back to its still as soon as the pointer leaves. */
              onPointerEnter={() => {
                /* Stacked, a tile opens on a tap (below), not on arrival. */
                if (stacked || isOpen) return;
                setOpen(agent.id);
                setPlays((n) => n + 1);
              }}
              /* Stacked, a tap on a closed row opens it (and closes the
                 open one); only the open tile's Try button leaves the page. */
              onClick={() => {
                if (!stacked || isOpen) return;
                setOpen(agent.id);
                setPlays((n) => n + 1);
              }}
              onKeyDown={(event) => {
                if (!stacked || isOpen) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setOpen(agent.id);
                setPlays((n) => n + 1);
              }}
              role={stacked && !isOpen ? "button" : undefined}
              tabIndex={stacked && !isOpen ? 0 : undefined}
              aria-expanded={stacked ? isOpen : undefined}
              onPointerLeave={(event) => {
                if (stacked || event.pointerType !== "mouse") return;
                setOpen((current) => (current === agent.id ? null : current));
              }}
            >
              <span className={styles.tint} aria-hidden="true" />

              {/* The way into the demo: the words sit in the tile's top-right
                  while the pointer is on it, and the link itself covers the
                  whole tile, so anywhere on it opens the demo. */}
              <a className={styles.try} href={agent.demo} target="_blank" rel="noopener noreferrer">
                <span className={styles.tryLabel}>
                  {agent.cta ?? "Try"}
                  <ArrowUpRight size={14} strokeWidth={2.75} aria-hidden="true" />
                </span>
              </a>

              <div className={styles.headRow}>
                <div className={styles.head}>
                  <span className={styles.chip}>{agent.kind ?? "Demo"}</span>
                  <span className={styles.label}>{agent.label}</span>
                  {/* What opening a tile adds to its head: on a phone it unfolds
                      (see .more); elsewhere the wrappers lay out as if absent. */}
                  <span className={styles.more}>
                    <span className={styles.moreInner}>
                      {agent.description && (
                        <span className={styles.description}>{agent.description}</span>
                      )}
                      {/* Phones only: the open tile's way into the demo, as the
                          site's standard button rather than a link over the tile. */}
                      <a
                        className={`${bevel.button} ${styles.tryButton}`}
                        href={agent.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isOpen ? undefined : -1}
                      >
                        <span className={bevel.label}>{agent.cta ?? "Try"}</span>
                        <span className={bevel.badge} aria-hidden="true">
                          <ArrowUpRight size={16} strokeWidth={2.25} />
                        </span>
                      </a>
                    </span>
                  </span>
                </div>
              </div>

              {/* The tile's screen, which on a phone unfolds under the head
                  (see .reveal); elsewhere the wrappers lay out as if absent. */}
              <div className={styles.reveal}>
                <div className={styles.revealInner}>
                  {agent.scene ? (
                    <div
                      className={styles.sceneLayer}
                      style={
                        {
                          "--scene-w": agent.scene.width,
                          "--scene-h": agent.scene.height,
                        } as CSSProperties
                      }
                    >
                      <div className={styles.sceneFrame}>
                        {/* Remounting on each opening replays the screen building
                            itself, the way the recordings replay. */}
                        <div
                          key={isOpen ? plays : "still"}
                          className={styles.sceneBox}
                          data-play={isOpen ? "on" : "off"}
                        >
                          {agent.scene.node}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div id={`agent-${agent.id}`} className={styles.card} aria-hidden={!isOpen}>
                      {/* Reads the sheet as a window onto the running app. */}
                      <span className={styles.chrome} aria-hidden="true" />
                      {seen && agent.answer && (
                        <div className={styles.answerClip}>
                          {/* Remounting on each opening restarts the recording from its
                              first frame, served from the browser cache: no new download.
                              A collapsed column holds the finished answer instead, as its
                              zoomed-out preview. */}
                          <video
                            key={isOpen ? plays : "still"}
                            className={styles.answer}
                            src={agent.answer.src}
                            aria-label={agent.answer.alt}
                            width={agent.answer.width}
                            height={agent.answer.height}
                            autoPlay={isOpen}
                            muted
                            playsInline
                            preload={isOpen ? "auto" : "metadata"}
                            onLoadedMetadata={(event) => {
                              const video = event.currentTarget;
                              /* Set on the element: there is no attribute for it. */
                              video.playbackRate = agent.answer?.rate ?? 1;
                              if (isOpen) return;
                              if (Number.isFinite(video.duration)) {
                                video.currentTime = Math.max(0, video.duration - 0.05);
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
