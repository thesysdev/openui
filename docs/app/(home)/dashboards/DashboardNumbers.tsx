import { ArrowRight, ChartColumnDecreasing, ChartLine, TrendingDown } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

/* From the OpenUI Lang comparison (docs/openui-lang/comparison): free-form
   HTML (CopilotKit OpenGenUI) writes ~4x the output tokens per screen, so
   each screen costs ~4x to generate, and streams in ~20s against OpenUI's
   4.9s at 60 tok/s. */
const FEWER_TOKENS = Math.round((1 - 1 / 4) * 100);
const LOWER_COST = FEWER_TOKENS;
const LESS_TO_STREAM = (20 / 4.9).toFixed(1);

/* The benefit leads, in two or three words, so each figure reads as good news
   at a glance; the detail underneath says against what. "Faster to stream"
   is the latency ratio: the same model streams a shorter response in
   proportionally less time. */
const NUMBERS = [
  {
    value: `${FEWER_TOKENS}%`,
    benefit: "fewer tokens",
    detail: "Than LLM-written HTML, per screen",
    Icon: ChartColumnDecreasing,
  },
  {
    value: `${LOWER_COST}%`,
    benefit: "cheaper",
    detail: "To generate each screen",
    Icon: TrendingDown,
  },
  {
    value: `${LESS_TO_STREAM}×`,
    benefit: "faster to stream",
    detail: "So dashboards render sooner",
    Icon: ChartLine,
  },
];

export function DashboardNumbers() {
  return (
    <section className={styles.numbersSection} aria-labelledby="dashboard-numbers-title">
      <div className={styles.container}>
        <h2 id="dashboard-numbers-title" className="sr-only">
          Benchmark results
        </h2>
        <dl className={styles.numbers}>
          {NUMBERS.map((item) => (
            <div key={item.benefit} className={styles.number}>
              {/* Phones only: a small graph tile above the figure. */}
              <span className={styles.numberIcon} aria-hidden="true">
                <item.Icon size={15} strokeWidth={1.75} />
              </span>
              <dt className={styles.numberLabel}>
                <span className={styles.numberBenefit}>{item.benefit}</span>
                <span className={styles.numberDetail}>{item.detail}</span>
              </dt>
              <dd className={styles.numberValue}>{item.value}</dd>
            </div>
          ))}
        </dl>
        <Link href="/benchmarks" className={styles.numbersLink}>
          See the benchmarks
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
