"use client";

import Link from "@/components/site-link";
import { SITE_NAV_LINKS } from "@/lib/site-nav-links";
import { ArrowUp } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./DemoShowcase.module.css";

/* Three real OpenUI apps, shown the way the thesys.dev hero shows its examples:
   one large screenshot at a time, tabs underneath, and a chat bar over the
   bottom of the frame that opens that demo. Screenshots rather than a live
   embed, so the page stays fast and every visitor sees the same good state.
   The images are 2x captures of the live demos (public/homepage/showcase). */

const ROTATE_MS = 6500;

const DEMOS = [
  {
    id: "compare",
    label: "Compare",
    src: "/homepage/showcase/compare-adspend.jpg",
    alt: "The same question about ad spend and sales answered as plain text and as generative UI with stat cards and a bar chart",
    prompt: "Tell me about the correlation between our ad spend and sales",
    href: `${SITE_NAV_LINKS.compare.href}?pair=markdown-cloud`,
  },
  {
    id: "f1",
    label: "F1 Dashboard",
    src: "/homepage/showcase/f1-season.jpg",
    alt: "The OpenUI F1 dashboard: the season's points race as a chart, and the Singapore podium with the three cars",
    prompt: "Who won in Singapore, and how did the title race change?",
    href: SITE_NAV_LINKS.f1Dashboard.href,
  },
  {
    id: "travel",
    label: "Travel",
    src: "/homepage/showcase/travel-answer.jpg",
    alt: "The OpenUI trip planner demo showing a Tokyo spring trip as a magazine-style spread",
    prompt: "Plan a long weekend in Tokyo in spring",
    href: "https://www.openui.com/demo/trip-planner/planner/chat",
  },
] as const;

export function DemoShowcase() {
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Rotate only while on screen, and stop once the reader picks a tab.
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (pinned || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => setActive((i) => (i + 1) % DEMOS.length), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [active, pinned, visible]);

  const demo = DEMOS[active];
  const external = /^https?:/.test(demo.href);
  // Hand the prompt over in the link (?prompt=), so a demo that reads it opens
  // with the question already typed in. Compare does; the others ignore it.
  const href = `${demo.href}${demo.href.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(demo.prompt)}`;

  return (
    <div ref={ref} className={styles.showcase}>
      <div className={styles.frame}>
        {DEMOS.map((item, index) => (
          <Image
            key={item.id}
            className={`${styles.shot} ${index === active ? styles.shotActive : ""}`.trim()}
            src={item.src}
            alt={item.alt}
            width={2880}
            height={1800}
            sizes="(max-width: 1279px) calc(100vw - 40px), 1200px"
            priority={index === 0}
            aria-hidden={index !== active}
          />
        ))}

        {/* The chat bar is the way in: it opens the demo it is sitting on. */}
        <Link
          key={demo.id}
          href={href}
          className={styles.chatBar}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          <span className={styles.chatPrompt}>{demo.prompt}</span>
          <span className={styles.chatHint}>Try the demo</span>
          <span className={styles.chatSend} aria-hidden="true">
            <ArrowUp size={16} strokeWidth={2.25} />
          </span>
        </Link>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Demos">
        {DEMOS.map((item, index) => {
          const isActive = index === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`.trim()}
              onClick={() => {
                setActive(index);
                setPinned(true);
              }}
            >
              {item.label}
              {isActive && !pinned && visible && (
                <span
                  key={`progress-${active}`}
                  className={styles.tabProgress}
                  style={{ animationDuration: `${ROTATE_MS}ms` }}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
