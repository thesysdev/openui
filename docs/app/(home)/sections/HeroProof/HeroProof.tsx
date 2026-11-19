import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import productStyles from "../ProductSection/ProductSection.module.css";
import { CountUp } from "./CountUp";
import styles from "./HeroProof.module.css";

/* The benchmark fold, laid out like the product bands' header: a two-line
   headline and a pill on the left; the two numbers with
   the copy under them on the right. The numbers are the speed benchmark's
   contact-form screen against json-render. */
export function HeroProof() {
  return (
    <section className={styles.section} aria-labelledby="benchmark-title">
      <div className={`${productStyles.product} ${styles.header}`}>
        <div className={productStyles.lockup}>
          <div className={`${productStyles.lead} ${styles.lead}`}>
            <h3 id="benchmark-title" className={`${productStyles.headline} ${styles.title}`}>
              Faster answers,
              <br />
              fewer tokens.
            </h3>
            <div className={`${productStyles.ctas} ${styles.ctas}`}>
              <BevelButton
                variant="secondary"
                href="/benchmarks?view=formats"
                label="See the benchmark"
                badge={<ArrowRight size={16} weight="bold" />}
              />
            </div>
          </div>
          {/* Right column: the two numbers, with the copy under them. */}
          <div className={styles.side}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <CountUp className={styles.statValue} value={3} suffix="x" />
                <span className={styles.statLabel}>faster generation</span>
              </div>
              <div className={styles.stat}>
                <CountUp className={styles.statValue} value={67} suffix="%" delay={200} />
                <span className={styles.statLabel}>fewer tokens</span>
              </div>
            </div>
            <p className={styles.sideNote}>
              OpenUI Lang generates up to 3x faster and uses 67% fewer tokens than JSON-based UI
              formats.
              <span className={styles.sideNotePhoneHidden}>
                {" "}
                Fewer tokens means every generation finishes sooner and costs less.
              </span>
            </p>
          </div>
        </div>
      </div>
      {/* The token race is hidden for now; BlockRace is kept for reuse. */}
    </section>
  );
}
