"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./CloudBanner.module.css";

/* The home page tags its FAQ wrapper with this so the banner knows where to
   stop. Anything without that id simply keeps the banner to the end. */
export const BANNER_END_ANCHOR_ID = "faq-band";

export function CloudBanner() {
  const [shouldShow, setShouldShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Appear once the hero is scrolled past, then retire when the FAQ arrives:
  // by that point the page is answering questions, not pitching.
  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.6;
      const end = document.getElementById(BANNER_END_ANCHOR_ID);
      const reachedEnd = end ? end.getBoundingClientRect().top <= window.innerHeight : false;
      setShouldShow(pastHero && !reachedEnd);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Mount, then open just after paint. On hide, play the exit before unmounting.
  useEffect(() => {
    const timers: number[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(window.setTimeout(callback, delay));
    };

    if (shouldShow) {
      schedule(() => setMounted(true), 0);
      schedule(() => setOpen(true), 20);
    } else {
      schedule(() => setOpen(false), 0);
      schedule(() => setMounted(false), 550);
    }

    return () => timers.forEach(window.clearTimeout);
  }, [shouldShow]);

  if (!mounted) return null;

  return (
    <Link
      href="/benchmarks"
      className={`${styles.banner} ${open ? styles.open : ""}`.trim()}
      aria-label="OpenUI Benchmarks: Compare Generative UI frameworks across models. View the results."
    >
      <span className={styles.content}>
        <span className={styles.text}>
          <span className={styles.lead}>
            OpenUI Benchmarks
            <span className={styles.colon}> :</span>
          </span>{" "}
          <span className={styles.rest}>Compare Generative UI frameworks across models</span>
        </span>
        <ArrowRight className={styles.chevron} size={18} strokeWidth={2.25} aria-hidden="true" />
      </span>
    </Link>
  );
}
