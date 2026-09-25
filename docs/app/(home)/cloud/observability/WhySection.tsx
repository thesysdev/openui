import layout from "../gateway/sections.module.css";
import { TraceGapDiagram } from "./TraceGapDiagram";
import styles from "./WhySection.module.css";

export function WhySection() {
  return (
    <section className={`${layout.section} ${styles.section}`} aria-labelledby="observability-why">
      <div className={layout.sectionLockup}>
        <h2 id="observability-why" className={`${layout.heading} ${styles.heading}`}>
          A successful trace
          <br />
          can still fail the user.
        </h2>
        <p className={layout.lead}>
          Tracing was built for services, where requests either succeed or fail. It shows what your
          agent did, not whether the user’s goal was met.
        </p>
      </div>

      <div className={styles.comparison}>
        <TraceGapDiagram />
      </div>
    </section>
  );
}
