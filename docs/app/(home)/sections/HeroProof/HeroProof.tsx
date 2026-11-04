import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import productStyles from "../ProductSection/ProductSection.module.css";
import { CountUp } from "./CountUp";
import styles from "./HeroProof.module.css";

/* The benchmark fold, laid out like the product bands' header: a two-line
   headline and a pill on the left; the two numbers with the copy under them
   on the right. The numbers come from the Generative UI benchmark
   (lib/benchmark-data.ts): cost per pass on Claude Opus 4.8, OpenUI $2.27
   against A2UI $5.85, and OpenUI's structural validity across all six models. */
export function HeroProof() {
  return (
    <section className={styles.section} aria-labelledby="benchmark-title">
      <div className={`${productStyles.product} ${styles.header}`}>
        <div className={productStyles.lockup}>
          <div className={`${productStyles.lead} ${styles.lead}`}>
            <h3 id="benchmark-title" className={`${productStyles.headline} ${styles.title}`}>
              Up to 2.6x cheaper than JSON.
              <br />
              Same reliability.
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
                <CountUp className={styles.statValue} value={2.6} decimals={1} suffix="x" />
                <span className={styles.statLabel}>cheaper than JSON</span>
              </div>
              <div className={styles.stat}>
                <CountUp
                  className={styles.statValue}
                  value={96.5}
                  decimals={1}
                  suffix="%"
                  delay={200}
                />
                <span className={styles.statLabel}>valid screens</span>
              </div>
            </div>
            <p className={styles.sideNote}>
              Across six models in the Generative UI benchmark, OpenUI was up to 2.6x cheaper than
              JSON formats, with similar or better validity (96.5%). Shorter output also means
              screens finish sooner.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
