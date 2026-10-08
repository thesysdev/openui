"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * Steps through a fixed sequence. Renders the final step until the figure first
 * scrolls into view, then plays from the start (unless reduced motion is on).
 * Playback pauses while the figure is off screen.
 */
export function usePlayback(steps: { duration: number }[], reducedMotion: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(steps.length - 1);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          if (!reducedMotion) {
            setStep(0);
            setPlaying(true);
          }
        }
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setTimeout(
      () => setStep((current) => (current + 1) % steps.length),
      steps[step].duration,
    );
    return () => window.clearTimeout(timer);
  }, [playing, visible, step, steps]);

  const goTo = useCallback((index: number) => {
    started.current = true;
    setPlaying(false);
    setStep(index);
  }, []);

  return { ref, step, playing: playing && visible, setPlaying, goTo };
}

export const PlayIcon = () => (
  <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l6.6-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" />
  </svg>
);

export const PauseIcon = () => (
  <svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
    <rect x="2.5" y="1.5" width="2.5" height="9" rx="0.8" />
    <rect x="7" y="1.5" width="2.5" height="9" rx="0.8" />
  </svg>
);

export const ReplayIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M2 6a4 4 0 1 0 1.2-2.85" strokeLinecap="round" />
    <path d="M2.2 1.5v2.2h2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
