import { ArrowUpRight, Layers3, UserRound, UserRoundPlus } from "lucide-react";
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

const BARS = [24, 35, 29, 49, 45, 39, 63, 57, 73, 68, 82, 77, 91, 87, 100, 96];

export function SharingIllustration() {
  return (
    <div className={styles.shareScene} aria-hidden="true">
      <div className={styles.preview}>
        <div className={styles.previewValue}>
          <span>Paid conversions</span>
          <strong>1,284</strong>
        </div>
        <span className={styles.change}>
          <ArrowUpRight /> 12.8%
        </span>
        <div className={styles.bars}>
          {BARS.map((height, index) => (
            <i
              key={height}
              data-recent={index >= 12 || undefined}
              style={{ height: `${height}%` }}
            />
          ))}
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
        <span className={styles.metricLabel}>Paid conversions</span>
        <strong>1,284</strong>
      </div>
      <div className={styles.sourceCard}>
        <div className={styles.sourceHeading}>
          <Layers3 /> Sources
        </div>
        <div className={styles.sourceRow}>
          <div className={styles.source}>
            <SourceMark source="posthog" />
            <div>
              <strong>Signups</strong>
              <span>PostHog</span>
            </div>
          </div>
          <div className={styles.source}>
            <SourceMark source="postgres" />
            <div>
              <strong>Orders</strong>
              <span>PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
