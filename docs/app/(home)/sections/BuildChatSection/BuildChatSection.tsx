"use client";

import { ClipboardCommandButton } from "../../components/Button/Button";
import styles from "./BuildChatSection.module.css";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle() {
  return <p className={styles.title}>Build a Generative UI chat in minutes</p>;
}

function CtaButton() {
  return (
    <div className={styles.ctaWrap}>
      <ClipboardCommandButton
        command="npx @openuidev/cli@latest create"
        className={styles.ctaButton}
        iconPosition="start"
      >
        <span className={styles.ctaLabel}>npx @openuidev/cli@latest create</span>
      </ClipboardCommandButton>
    </div>
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
          <div aria-hidden="true" className={styles.overlay} />

          <div className={styles.content}>
            <div className={styles.copyColumn}>
              <div className={styles.copyStack}>
                <SectionTitle />
              </div>
              <CtaButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
