import { ArrowUpRight, ScanLine, UserRound, UserRoundPlus } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./LaunchIllustrations.module.css";

const SOURCE_MARKS = {
  posthog: 'url("/integration-logos/posthog.svg")',
  postgres: 'url("/integration-logos/postgresql.svg")',
};

function SourceMark({ source }: { source: keyof typeof SOURCE_MARKS }) {
  return (
    <span
      className={styles.sourceMark}
      data-source={source}
      style={{ "--source-mark": SOURCE_MARKS[source] } as CSSProperties}
    />
  );
}

const BARS = [43, 34, 57, 48, 66, 56, 61, 79, 71, 89, 82, 100];

export function SharingIllustration() {
  return (
    <div className={styles.shareScene} aria-hidden="true">
      <div className={styles.preview}>
        <div className={styles.previewChart}>
          <span className={styles.previewLabel}>Paid conversions</span>
          <div className={styles.bars}>
            {BARS.map((height, index) => (
              <i
                key={height}
                data-recent={index > 8 || undefined}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
        <div className={styles.previewTile}>
          <span className={styles.previewLabel}>Conversion rate</span>
          <strong>4.8%</strong>
          <ArrowUpRight />
        </div>
      </div>
      <div className={styles.shareCard}>
        <div className={styles.shareHeader}>
          <span className={styles.dashboardName}>Growth overview</span>
          <span className={styles.shareButton}>
            <UserRoundPlus /> Share
          </span>
        </div>
        <div className={styles.shareFooter}>
          <div className={styles.people}>
            <span>
              <UserRound />
            </span>
            <span>
              <UserRound />
            </span>
            <span>
              <UserRound />
            </span>
          </div>
          <div className={styles.shareMarks}>
            <SourceMark source="posthog" />
            <SourceMark source="postgres" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SourcesIllustration() {
  return (
    <div className={styles.sourcesScene} aria-hidden="true">
      <div className={styles.metric}>
        <div>
          <span className={styles.metricLabel}>Paid conversions</span>
          <strong>1,284</strong>
        </div>
        <span className={styles.inspect}>
          <ScanLine />
        </span>
      </div>
      <div className={styles.sourceBranch}>
        <span>Sources</span>
      </div>
      <div className={styles.sourceRow}>
        <div className={styles.source}>
          <SourceMark source="posthog" />
          <div>
            <strong>PostHog</strong>
            <span>Signups</span>
          </div>
        </div>
        <div className={styles.source}>
          <SourceMark source="postgres" />
          <div>
            <strong>PostgreSQL</strong>
            <span>Orders</span>
          </div>
        </div>
      </div>
    </div>
  );
}
