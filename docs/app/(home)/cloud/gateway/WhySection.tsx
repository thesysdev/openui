import { Button } from "@/components/button";
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
        <p className={styles.problemConclusionCopy}>
          OpenUI produces more structurally valid output than Google A2UI and Vercel json-render,
          with about half the tokens and streaming time. Gateway catches what remains.
        </p>
        <div className={styles.problemConclusionActions}>
          <Button href="/benchmarks?view=formats" text="Compare formats" variant="tertiary" />
          <Button href="/benchmarks" text="Compare models" variant="tertiary" />
        </div>
      </div>
    </section>
  );
}
