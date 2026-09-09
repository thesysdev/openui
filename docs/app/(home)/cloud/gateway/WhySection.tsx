import { production } from "@/lib/benchmark-data";
import { FailureBreakdown } from "./FailureBreakdown";
import styles from "./sections.module.css";

export function WhySection() {
  return (
    <section className={`${styles.section} ${styles.problemSection}`} aria-labelledby="gateway-why">
      <div className={`${styles.sectionLockup} ${styles.problemLockup}`}>
        <div>
          <h2 id="gateway-why" className={styles.heading}>
            {production.triggerRate}% of UI generations fail silently in production
          </h2>
        </div>
        <p className={styles.lead}>
          Failures are easy to miss because the request still succeeds. Based on 1,285 production
          failures observed over 15 days.
        </p>
      </div>

      <FailureBreakdown />

      <div className={styles.problemConclusion}>
        <p className={styles.lead}>
          OpenUI beats Google A2UI and Vercel json-render on structural validity while using about
          half the tokens and streaming time. Stronger models reduce errors further. Gateway catches
          and repairs what remains before users see it.
        </p>
        <div className={styles.linkRow}>
          <a className={styles.link} href="/benchmarks?view=formats">
            Compare formats →
          </a>
          <a className={styles.link} href="/benchmarks">
            Compare models →
          </a>
        </div>
      </div>
    </section>
  );
}
