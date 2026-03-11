"use client";

import { PreviewCode, PreviewPage, PreviewSection } from "@design-system/components/preview";
import styles from "@design-system/components/preview/PreviewLayout.module.css";
import { useMemo } from "react";

export default function MotionPreviewPage() {
  const motionTokens = useMemo(
    () => [
      "--motion-duration-fast",
      "--motion-duration-default",
      "--motion-duration-slow",
      "--motion-duration-slower",
    ],
    [],
  );

  const tokenValues = useMemo(() => {
    if (typeof window === "undefined") return {};

    const computedStyles = getComputedStyle(document.documentElement);
    const map: Record<string, string> = {};
    motionTokens.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0ms";
    });
    map["--motion-ease-standard"] =
      computedStyles.getPropertyValue("--motion-ease-standard").trim() || "ease";
    map["--motion-ease-emphasized"] =
      computedStyles.getPropertyValue("--motion-ease-emphasized").trim() || "ease-in-out";
    return map;
  }, [motionTokens]);

  const motionCode = `:root {
  --motion-duration-fast: 120ms;
  --motion-duration-default: 200ms;
  --motion-duration-slow: 320ms;
  --motion-duration-slower: 480ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1.2);
}`;

  return (
    <PreviewPage>
      <PreviewSection
        title="Motion"
        headingLevel="h1"
        description="Motion tokens standardize durations and easings for transitions and micro-interactions."
      >
        <div className={styles.tokenRows}>
          {motionTokens.map((token) => (
            <article key={token} className={styles.motionRow}>
              <div>
                <code className={styles.tokenName}>{token}</code>
                <div className={styles.tokenValue}>{tokenValues[token] ?? "..."}</div>
              </div>
              <div className={styles.motionTrack}>
                <span
                  className={styles.motionDot}
                  style={{
                    animationName: "foundationMotionSlide",
                    animationDuration: `var(${token})`,
                    animationTimingFunction: "var(--motion-ease-standard)",
                    animationIterationCount: "infinite",
                    animationDirection: "alternate",
                  }}
                />
              </div>
            </article>
          ))}
          <article className={styles.tokenRow}>
            <code className={styles.tokenName}>--motion-ease-standard</code>
            <code className={styles.tokenValue}>
              {tokenValues["--motion-ease-standard"] ?? "..."}
            </code>
            <div className={styles.tokenPreview}>Primary easing curve</div>
          </article>
          <article className={styles.tokenRow}>
            <code className={styles.tokenName}>--motion-ease-emphasized</code>
            <code className={styles.tokenValue}>
              {tokenValues["--motion-ease-emphasized"] ?? "..."}
            </code>
            <div className={styles.tokenPreview}>Emphasized easing curve</div>
          </article>
        </div>
        <PreviewCode code={motionCode} />
      </PreviewSection>
    </PreviewPage>
  );
}
