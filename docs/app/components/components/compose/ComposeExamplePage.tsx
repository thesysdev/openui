"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppTheme } from "@components/components/AppThemeProvider/AppThemeProvider";
import SegmentedToggle from "@components/components/preview/SegmentedToggle";
import type { GuideExample } from "@components/config/guide";
import { ThemeProvider, type Theme } from "@openuidev/react-ui/ThemeProvider";
import styles from "./ComposeExamplePage.module.css";

const RealBlocksCanvas = dynamic(
  () => import("@components/components/ThemeBuilder/realBlocksCanvas"),
  { ssr: false },
);

interface ComposeExamplePageProps {
  example: GuideExample;
}

interface CssLine {
  property: string;
  value: string;
  previousValue: string | null;
}

function buildCssLines(
  vars: Record<string, string>,
  previousVars: Record<string, string>,
  defaults: Record<string, string>,
): CssLine[] {
  return Object.entries(vars).map(([property, value]) => ({
    property,
    value,
    previousValue: previousVars[property] ?? defaults[property] ?? null,
  }));
}

export default function ComposeExamplePage({ example }: ComposeExamplePageProps) {
  const { mode } = useAppTheme();
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<"preview" | "css">("preview");

  const hasThemeGuide = example.goalTheme != null;
  const activeStep = activeStepIndex != null ? example.steps[activeStepIndex] : null;

  const leftPanelRef = useRef<HTMLDivElement>(null);

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollFade = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    setCanScrollUp(panel.scrollTop > 2);
    setCanScrollDown(panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2);
  }, []);

  useEffect(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    updateScrollFade();
    panel.addEventListener("scroll", updateScrollFade, { passive: true });
    const ro = new ResizeObserver(updateScrollFade);
    ro.observe(panel);
    return () => {
      panel.removeEventListener("scroll", updateScrollFade);
      ro.disconnect();
    };
  }, [updateScrollFade]);

  const cumulativeTheme = useMemo(() => {
    if (activeStepIndex == null) {
      return {};
    }
    return example.steps
      .slice(0, activeStepIndex + 1)
      .reduce<Record<string, string>>((acc, step) => ({ ...acc, ...step.themeOverrides }), {});
  }, [activeStepIndex, example.steps]);

  const previousCumulativeCss = useMemo(() => {
    if (activeStepIndex == null || activeStepIndex === 0) {
      return {};
    }
    return example.steps
      .slice(0, activeStepIndex)
      .reduce<Record<string, string>>((acc, step) => ({ ...acc, ...step.cssVariables }), {});
  }, [activeStepIndex, example.steps]);

  const previewTheme = useMemo((): Partial<Theme> => {
    if (!hasThemeGuide) {
      return {};
    }
    if (activeStepIndex == null) {
      if (rightPanelMode === "css") {
        return (example.goalTheme ?? {}) as Partial<Theme>;
      }
      return {};
    }
    return cumulativeTheme as Partial<Theme>;
  }, [hasThemeGuide, activeStepIndex, rightPanelMode, example.goalTheme, cumulativeTheme]);

  const toggleValue = rightPanelMode;
  const toggleLabels =
    activeStepIndex == null
      ? { preview: "Start", css: "Goal" }
      : { preview: "Preview", css: "CSS" };

  const handleToggle = (value: "preview" | "css") => {
    setRightPanelMode(value);
  };

  const handleStepClick = (index: number) => {
    if (activeStepIndex === index) {
      return;
    }
    setActiveStepIndex(index);
    setRightPanelMode("preview");
  };

  const handleIntroClick = () => {
    setActiveStepIndex(null);
    setRightPanelMode("preview");
  };

  const showCodeBlock =
    rightPanelMode === "css" && activeStepIndex != null && activeStep?.cssVariables;

  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        {/* Left panel */}
        <div
          className={`${styles.leftPanel}${canScrollUp ? ` ${styles.fadeTop}` : ""}${canScrollDown ? ` ${styles.fadeBottom}` : ""}`}
          ref={leftPanelRef}
        >
          <div className={styles.exampleHeader}>
            <h1 className={styles.exampleTitle}>{example.title}</h1>
            <p className={styles.exampleDescription}>{example.summary}</p>
          </div>

          <ul className={styles.stepList} role="list">
            {hasThemeGuide && (
              <li>
                <section className={styles.stepSection} aria-label="Step 0: Spotting differences">
                  <button
                    type="button"
                    className={`${styles.stepHeader}${activeStepIndex == null ? ` ${styles.stepHeaderActive}` : ""}`}
                    onClick={handleIntroClick}
                    aria-current={activeStepIndex == null ? "step" : undefined}
                  >
                    <span className={styles.stepTitle}>Spotting the differences</span>
                    <span className={styles.stepDescription}>
                      First, let&rsquo;s compare the starting theme with the final goal side by side
                      to understand what we&rsquo;re aiming for.
                    </span>
                  </button>
                </section>
              </li>
            )}
            {example.steps.map((step, index) => {
              const isActive = index === activeStepIndex;
              return (
                <li key={step.id}>
                  <section
                    id={step.id}
                    className={styles.stepSection}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    <button
                      type="button"
                      className={`${styles.stepHeader}${isActive ? ` ${styles.stepHeaderActive}` : ""}`}
                      onClick={() => handleStepClick(index)}
                      aria-current={isActive ? "step" : undefined}
                    >
                      <span className={styles.stepNumber}>{index + 1}</span>
                      <span className={styles.stepTitle}>{step.title}</span>
                      <span className={styles.stepDescription}>{step.description}</span>
                    </button>
                  </section>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right panel */}
        <div
          className={styles.rightPanel}
          role="region"
          aria-label={
            activeStep ? `Preview for step ${activeStepIndex! + 1}: ${activeStep.title}` : "Preview"
          }
        >
          {hasThemeGuide && (
            <div className={styles.toggleBar}>
              <SegmentedToggle
                ariaLabel="Preview mode"
                options={[
                  { label: toggleLabels.preview, value: "preview" as const },
                  { label: toggleLabels.css, value: "css" as const },
                ]}
                value={toggleValue}
                onChange={handleToggle}
              />
            </div>
          )}

          {showCodeBlock ? (
            <div className={styles.codeScroll}>
              <pre className={styles.codeBlock}>
                <code>
                  {buildCssLines(
                    activeStep!.cssVariables!,
                    previousCumulativeCss,
                    example.defaultCssVariables ?? {},
                  ).map((line, i) => (
                    <span key={i} className={styles.codeLine}>
                      <span className={styles.codeProperty}>{line.property}</span>
                      <span className={styles.codePunctuation}>: </span>
                      <span className={styles.codeValue}>{line.value}</span>
                      <span className={styles.codePunctuation}>;</span>
                      {line.previousValue != null && (
                        <span className={styles.codeComment}>
                          {" /* was: "}
                          {line.previousValue}
                          {" */"}
                        </span>
                      )}
                      {"\n"}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          ) : (
            <div className={styles.previewScroll}>
              <ThemeProvider
                mode={mode}
                theme={previewTheme}
                cssSelector={`.${styles.previewScope}`}
              >
                <div className={styles.previewScope}>
                  <RealBlocksCanvas />
                </div>
              </ThemeProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
