"use client";

import type { ComposeExample } from "@design-system/config/compose";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./ComposeExamplePage.module.css";

interface ComposeExamplePageProps {
  example: ComposeExample;
  nextExampleId?: string;
}

export default function ComposeExamplePage({ example, nextExampleId }: ComposeExamplePageProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  const scrollToStep = (index: number) => {
    setActiveStepIndex(index);
    const section = sectionRefs.current[index];
    const panel = leftPanelRef.current;
    if (!section || !panel) {
      return;
    }
    const sectionTop =
      section.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
    panel.scrollTo({ top: sectionTop, behavior: "smooth" });
  };

  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel || example.steps.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) {
          return;
        }

        const best = visible.reduce((a, b) => (b.intersectionRatio > a.intersectionRatio ? b : a));
        const id = best.target.getAttribute("id");
        if (!id) {
          return;
        }

        const idx = example.steps.findIndex((step) => step.id === id);
        if (idx >= 0) {
          setActiveStepIndex(idx);
        }
      },
      { root: panel, rootMargin: "0px 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sectionRefs.current.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, [example.steps]);

  return (
    <div className={styles.shell}>
      <div className={styles.topRow}>
        <Link href="/docs/design-system/compose" className={styles.navLink}>
          ← Back
        </Link>
        {nextExampleId ? (
          <Link href={`/docs/design-system/compose/${nextExampleId}`} className={styles.navLink}>
            Next →
          </Link>
        ) : (
          <span className={styles.navLinkDisabled}>Next →</span>
        )}
      </div>

      <div className={styles.body}>
        <div ref={leftPanelRef} className={styles.leftPanel}>
          <ul className={styles.stepList} role="list">
            {example.steps.map((step, index) => {
              const isActive = index === activeStepIndex;
              return (
                <li key={step.id}>
                  <section
                    id={step.id}
                    ref={(el) => {
                      sectionRefs.current[index] = el;
                    }}
                    className={styles.stepSection}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    <button
                      type="button"
                      className={`${styles.stepHeader}${isActive ? ` ${styles.stepHeaderActive}` : ""}`}
                      onClick={() => scrollToStep(index)}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span className={styles.stepLabel}>Step {index + 1}</span>
                      <span className={styles.stepTitle}>{step.title}</span>
                    </button>
                  </section>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={styles.rightPanel}>{/* Preview components will be added per step */}</div>
      </div>
    </div>
  );
}
