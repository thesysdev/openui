"use client";

import dashboardImg from "@/public/images/home/d67b5e94653944c1d0d4998c6b169c37f98060ad.png";
import Image from "next/image";
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

function DashboardIllustration() {
  return (
    <Image
      src={dashboardImg}
      alt="AI chat dashboard illustration"
      className={styles.dashboardImage}
      placeholder="blur"
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
          <div aria-hidden="true" className={styles.overlay} />

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
