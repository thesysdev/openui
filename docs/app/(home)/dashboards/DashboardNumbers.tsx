import { COST_MODELS, costPerPass, tokens } from "@/lib/benchmark-data";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

/* Derived from the benchmark data, never typed. The baseline is json-render,
   the JSON format that writes the most tokens per screen: fewer output tokens
   is where both the lower cost and the shorter stream come from. */
const { openui, jsonRender } = tokens.outputPerScreen;
const FEWER_TOKENS = Math.round((1 - openui / jsonRender) * 100);
const LOWER_COST = Math.round(
  (COST_MODELS.reduce(
    (sum, id) => sum + (1 - costPerPass[id]!.openui / costPerPass[id]!.jsonRender),
    0,
  ) /
    COST_MODELS.length) *
    100,
);
const LESS_TO_STREAM = (jsonRender / openui).toFixed(1);

/* The benefit leads, in two or three words, so each figure reads as good news
   at a glance; the detail underneath says against what. "Faster to stream"
   is the output-token ratio: the same model streams a shorter response in
   proportionally less time. */
const NUMBERS = [
  {
    value: `${FEWER_TOKENS}%`,
    benefit: "fewer tokens",
    detail: "Than JSON UI formats, per screen",
  },
  { value: `${LOWER_COST}%`, benefit: "cheaper", detail: "To generate each screen" },
  {
    value: `${LESS_TO_STREAM}×`,
    benefit: "faster to stream",
    detail: "So dashboards render sooner",
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
