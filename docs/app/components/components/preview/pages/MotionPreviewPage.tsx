"use client";

import { PreviewPage, PreviewSection } from "@components/components/preview";
import styles from "@components/components/preview/PreviewLayout.module.css";
import { useEffect, useState } from "react";

const MOTION_TOKENS = [
  "--motion-duration-fast",
  "--motion-duration-default",
  "--motion-duration-slow",
  "--motion-duration-slower",
];

export default function MotionPreviewPage() {
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const computedStyles = getComputedStyle(document.body);
    const map: Record<string, string> = {};
    MOTION_TOKENS.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0ms";
    });
    map["--motion-ease-standard"] =
      computedStyles.getPropertyValue("--motion-ease-standard").trim() || "ease";
    map["--motion-ease-emphasized"] =
      computedStyles.getPropertyValue("--motion-ease-emphasized").trim() || "ease-in-out";
    setTokenValues(map);
  }, []);

  return (
    <PreviewPage>
      <PreviewSection
        title="Motion"
        headingLevel="h1"
        description="Motion tokens standardize durations and easings for transitions and micro-interactions."
      >
        <div className={styles.tokenRows}>
          {MOTION_TOKENS.map((token) => (
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
      </PreviewSection>
    </PreviewPage>
  );
}
