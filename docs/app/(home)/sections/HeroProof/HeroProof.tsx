import { completionOver, MODELS } from "@/lib/benchmark-data";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { BevelButton } from "../../components/Button/BevelButton";
import productStyles from "../ProductSection/ProductSection.module.css";
import { CountUp } from "./CountUp";
import styles from "./HeroProof.module.css";

/* The benchmark fold, laid out like the product bands' header: a two-line
   headline and a pill on the left; the two numbers with the copy under them
   on the right. The numbers come from the Generative UI benchmark
   (lib/benchmark-data.ts): 2.6x is the largest cost-per-pass ratio (Claude
   Opus 4.8, OpenUI $2.27 against A2UI $5.85), 1.8x the smallest, and validity
   is OpenUI's pooled completion across all six models. */
const OPENUI_VALIDITY = Number(completionOver("openui").toFixed(1));

export function HeroProof() {
  return (
    <section className={styles.section} aria-labelledby="benchmark-title">
      <div className={`${productStyles.product} ${styles.header}`}>
        <div className={productStyles.lockup}>
          <div className={`${productStyles.lead} ${styles.lead}`}>
            <h3 id="benchmark-title" className={`${productStyles.headline} ${styles.title}`}>
              Up to 2.6x cheaper than JSON.
              <br />
              Matched or better reliability.
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
                  value={OPENUI_VALIDITY}
                  decimals={1}
                  suffix="%"
                  delay={200}
                />
                <span className={styles.statLabel}>
                  valid screens across {MODELS.length} models
                </span>
              </div>
            </div>
            <p className={styles.sideNote}>
              OpenUI Lang writes less than half the tokens of JSON-based UI formats, with the
              highest validity across six models. Fewer tokens means every screen finishes about 2x
              sooner and costs less.
            </p>
          </div>
        </div>
      </div>
      {/* The token race is hidden for now; BlockRace is kept for reuse. */}
    </section>
  );
}
