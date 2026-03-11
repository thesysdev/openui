"use client";

import { useEffect, useRef, useState } from "react";
import { CopyIcon } from "../shared/shared";
import styles from "./BuildChatSection.module.css";

const dashboardImg = "/images/home/d67b5e94653944c1d0d4998c6b169c37f98060ad.png";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_SHADOW = "0px 8px 16px -4px rgba(22,34,51,0.08)";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle() {
  return <p className={styles.title}>Build a Generative UI chat in minutes</p>;
}

function CtaButton() {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    if (copied) return;

    try {
      await navigator.clipboard.writeText("npx create openui-app chat");
      setCopied(true);
      resetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.ctaWrap}>
      <button
        onClick={handleClick}
        className={styles.ctaButton}
      >
        <span className={styles.iconFrame}>
          <span
            className={`${styles.iconLayer} ${copied ? styles.iconHidden : styles.iconVisible}`}
          >
            <CopyIcon />
          </span>
          <svg
            className={`${styles.iconLayer} ${copied ? styles.iconVisible : styles.iconHidden}`}
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              d="M11.6667 3.5L5.25 9.91667L2.33334 7"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span className={styles.ctaLabel}>
          npx create openui-app chat
        </span>
      </button>
    </div>
  );
}

function DashboardIllustration() {
  return (
    <img
      src={dashboardImg}
      alt="AI chat dashboard illustration"
      className={styles.dashboardImage}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BuildChatSection() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Border + shadow overlay */}
          <div
            aria-hidden="true"
            className={styles.overlay}
            style={{ boxShadow: CARD_SHADOW }}
          />

          <div className={styles.content}>
            {/* Left: text content */}
            <div className={styles.copyColumn}>
              <div className={styles.copyStack}>
                <SectionTitle />
              </div>
              <CtaButton />
            </div>

            {/* Right: illustration */}
            <div className={styles.mediaColumn}>
              <DashboardIllustration />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
