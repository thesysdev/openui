"use client";

import { ArrowRight, ArrowUpRight, Pause, Play, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import type { ShowcaseProject } from "../../data/community-showcase";
import styles from "./CommunityShowcaseSection.module.css";

/* The Integrations page, where the rest of what people have built is listed. */
const MORE_HREF = "/docs/integrations";
const ADD_PROJECT_URL = "https://github.com/thesysdev/openui/issues";

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
      <div>
        <ol className={styles.list}>
          {projects.map((item, index) => {
            const isActive = index === active;
            return (
              <li key={item.name} className={isActive ? styles.itemActive : styles.item}>
                <div className={styles.itemHeader}>
                  <button
                    type="button"
                    className={styles.itemToggle}
                    aria-expanded={isActive}
                    onClick={() => select(index)}
                  >
                    <span className={styles.name}>{item.name}</span>
                  </button>
                  <a
                    className={styles.visit}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${item.name}`}
                  >
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                </div>
                <div className={styles.panel} inert={!isActive}>
                  <div className={styles.panelInner}>
                    <p className={styles.meta}>
                      Built by{" "}
                      <a
                        className={styles.maker}
                        href={item.makerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.maker}
                      </a>
                    </p>
                    {/* Every description is laid out in the same cell and only this
                        project's is shown, so each panel is as tall as the longest
                        one and switching projects never changes the list's height. */}
                    <div className={styles.description}>
                      {projects.map((other) =>
                        other === item ? (
                          <p key={other.name}>{other.description}</p>
                        ) : (
                          <p key={other.name} className={styles.sizer} aria-hidden="true">
                            {other.description}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                </div>
                <span className={styles.progressTrack} aria-hidden="true">
                  {isActive && <span ref={progressRef} className={styles.progressFill} />}
                </span>
              </li>
            );
          })}
        </ol>
        <p className={styles.more}>
          <Link className={styles.moreLink} href={MORE_HREF}>
            and many more
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a
            className={styles.addLink}
            href={ADD_PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Plus size={14} aria-hidden="true" />
            Add yours
          </a>
        </p>
      </div>

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
