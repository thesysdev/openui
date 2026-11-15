"use client";

import { ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { ShowcaseProject } from "../../data/community-showcase";
import styles from "./CommunityShowcaseSection.module.css";

function hostOf(href: string): string {
  return new URL(href).hostname.replace(/^www\./, "");
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/* The five featured projects as a playlist: the list picks the project, the
   stage plays its recording, and the recording ending moves to the next one. */
export function ShowcasePlayer({ projects }: { projects: ShowcaseProject[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  // Until the reader uses the toggle, reduced motion decides: no autoplay.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reducedMotion;
  const project = projects[active];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  // Plays only on screen and while not paused; `active` is a dependency so a
  // newly mounted recording starts too.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && !paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [visible, paused, active]);

  const setProgress = (fraction: number) => {
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${fraction})`;
  };

  const select = (index: number) => {
    setProgress(0);
    setActive(index);
  };

  return (
    <div ref={hostRef} className={styles.player}>
      <ol className={styles.list}>
        {projects.map((item, index) => {
          const isActive = index === active;
          return (
            <li key={item.name} className={isActive ? styles.itemActive : styles.item}>
              <button
                type="button"
                className={styles.itemHeader}
                aria-expanded={isActive}
                onClick={() => select(index)}
              >
                <span className={styles.rank}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.tags}>{item.tags.join(" · ")}</span>
              </button>
              <div className={styles.panel} inert={!isActive}>
                <div className={styles.panelInner}>
                  <p className={styles.description}>{item.description}</p>
                  <p className={styles.meta}>
                    <span>Built by {item.maker}</span>
                    <a
                      className={styles.visit}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {hostOf(item.href)}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </p>
                </div>
              </div>
              <span className={styles.progressTrack} aria-hidden="true">
                {isActive && <span ref={progressRef} className={styles.progressFill} />}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={styles.stage}>
        <video
          // Keyed so each project mounts a fresh element and starts from zero.
          key={project.video}
          ref={videoRef}
          className={styles.video}
          src={project.video}
          poster={project.poster}
          muted
          playsInline
          preload="metadata"
          aria-label={`Screen recording of ${project.name}`}
          onTimeUpdate={(event) => {
            const { currentTime, duration } = event.currentTarget;
            if (duration > 0) setProgress(currentTime / duration);
          }}
          onEnded={() => select((active + 1) % projects.length)}
        />
        <button
          type="button"
          className={styles.playToggle}
          aria-label={paused ? "Play the recordings" : "Pause the recordings"}
          onClick={() => setUserPaused(!paused)}
        >
          {paused ? (
            <Play size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
          ) : (
            <Pause size={12} strokeWidth={0} fill="currentColor" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
