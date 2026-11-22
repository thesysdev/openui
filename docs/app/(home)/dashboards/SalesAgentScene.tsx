import { ArrowRight, Clock, MapPin, Target, Undo2 } from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./SalesAgentScene.module.css";

/* The Sales agent tile: the query builder, a click on Build dashboard, and
   the dashboard streaming in under the question, first as shimmer and then
   as the real thing. At rest (and with reduced motion) it shows the finished
   dashboard alone. Drawn light in both themes, at its own pixel size, and
   scaled by whatever holds it. The numbers are the demo's own for last
   month, so they add up: four regions to $781.0K target and $795.3K actual. */

export const SALES_AGENT_SCENE = { width: 1200, height: 660 };

const QUERY = "Show me net sales vs target by region for last month.";

/* Times, in seconds from the moment the pointer arrives. */
const T = {
  /* The skeleton cards land, one after another. */
  skeleton: 1.75,
  /* Each card's real content replaces its shimmer from here. */
  title: 2.45,
  kpi: 2.7,
  chart: 3.2,
  table: 3.6,
};
const s = (value: number) => `${value.toFixed(2)}s`;

const KPIS = [
  { label: "Total target", value: "$781.0K", note: "Sum of four regions" },
  { label: "Total actual", value: "$795.3K", note: "Net of refunds" },
  { label: "Attainment", value: "101.8%", note: "Actual ÷ target" },
  { label: "Gap to target", value: "+$14.3K", note: "Above target", good: true },
];

/* Thousands of dollars. The chart's axis runs to 300. */
const REGIONS = [
  { name: "West", target: 195.4, actual: 157.7 },
  { name: "South", target: 286.9, actual: 293.8 },
  { name: "Midwest", target: 153.2, actual: 165.9 },
  { name: "Northeast", target: 145.5, actual: 177.9 },
];
const AXIS_MAX = 300;

const RANKED = [
  { name: "Northeast", actual: "$177.9K", rate: "122.3%", met: true },
  { name: "Midwest", actual: "$165.9K", rate: "108.3%", met: true },
  { name: "South", actual: "$293.8K", rate: "102.4%", met: true },
  { name: "West", actual: "$157.7K", rate: "80.7%", met: false },
];

/* A card's timing: when its shimmer lands and when the real content takes
   over from it. */
function timing(start: number, reveal: number) {
  return { "--s": s(start), "--r": s(reveal) } as CSSProperties;
}

function Shimmer({ lines }: { lines: string[] }) {
  return (
    <span className={styles.skeleton} aria-hidden="true">
      {lines.map((width, i) => (
        <i key={i} style={{ width }} />
      ))}
    </span>
  );
}

export function SalesAgentScene() {
  return (
    <div className={styles.scene}>
      {/* ── The query builder, shown only while the tile plays ── */}
      <div className={styles.builder} aria-hidden="true">
        <div className={styles.sentence}>
          <span>Show me</span>
          <span className={`${styles.slot} ${styles.slotMetric}`}>
            <Target />
            net sales vs target
          </span>
          <span>by</span>
          <span className={`${styles.slot} ${styles.slotRegion}`}>
            <MapPin />
            region
          </span>
          <span>for</span>
          <span className={`${styles.slot} ${styles.slotTime}`}>
            <Clock />
            last month.
          </span>
          <span className={styles.build}>
            Build dashboard
            <ArrowRight />
            {/* The pointer that presses it. */}
            <svg className={styles.cursor} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 3l14 8.5-6.2 1.3L9.6 19z" />
            </svg>
          </span>
          <Undo2 className={styles.undo} />
        </div>
      </div>

      {/* ── The answer: the question on top, the dashboard under it ── */}
      <div className={styles.answer}>
        <div className={styles.askRow}>
          <span className={styles.ask}>{QUERY}</span>
        </div>

        <div className={styles.titleBlock} style={timing(T.skeleton, T.title)}>
          <Shimmer lines={["34%", "22%"]} />
          <div className={styles.real}>
            <h3 className={styles.title}>Net sales vs target by region</h3>
            <p className={styles.subtitle}>Last month · USD · from PostgreSQL</p>
          </div>
        </div>

        <div className={styles.kpis}>
          {KPIS.map((kpi, i) => (
            <div
              key={kpi.label}
              className={styles.card}
              style={timing(T.skeleton + 0.06 * i, T.kpi + 0.1 * i)}
            >
              <Shimmer lines={["46%", "64%", "38%"]} />
              <div className={`${styles.real} ${styles.kpi}`}>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                <span className={`${styles.kpiValue} ${kpi.good ? styles.good : ""}`.trim()}>
                  {kpi.value}
                </span>
                <span className={styles.kpiNote}>{kpi.note}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.row}>
          <div
            className={`${styles.card} ${styles.chartCard}`}
            style={timing(T.skeleton + 0.24, T.chart)}
          >
            <Shimmer lines={["44%", "26%", "100%", "100%", "100%"]} />
            <div className={styles.real}>
              <span className={styles.cardTitle}>Target vs actual by region</span>
              <span className={styles.cardSub}>Last month · USD</span>
              <span className={styles.legend}>
                <i className={styles.keyTarget} />
                Target
                <i className={styles.keyActual} />
                Actual
              </span>
              <div className={styles.plot}>
                <div className={styles.axis}>
                  {[300, 200, 100, 0].map((tick) => (
                    <span key={tick}>{tick === 0 ? "$0" : `$${tick}K`}</span>
                  ))}
                </div>
                <div className={styles.bars}>
                  {REGIONS.map((region, i) => (
                    <div key={region.name} className={styles.group}>
                      <div className={styles.pair}>
                        <i
                          className={styles.barTarget}
                          style={
                            {
                              height: `${(region.target / AXIS_MAX) * 100}%`,
                              "--b": s(T.chart + 0.08 * i),
                            } as CSSProperties
                          }
                        />
                        <i
                          className={styles.barActual}
                          style={
                            {
                              height: `${(region.actual / AXIS_MAX) * 100}%`,
                              "--b": s(T.chart + 0.08 * i + 0.04),
                            } as CSSProperties
                          }
                        />
                      </div>
                      <span className={styles.groupName}>{region.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`${styles.card} ${styles.tableCard}`}
            style={timing(T.skeleton + 0.3, T.table)}
          >
            <Shimmer lines={["58%", "30%", "100%", "100%", "100%", "100%"]} />
            <div className={styles.real}>
              <span className={styles.cardTitle}>Regions ranked by attainment</span>
              <span className={styles.cardSub}>Actual against each region&apos;s target</span>
              <div className={styles.table}>
                <span className={`${styles.tr} ${styles.thead}`}>
                  <span>Region</span>
                  <span className={styles.num}>Actual</span>
                  <span className={styles.num}>Attainment</span>
                  <span>Status</span>
                </span>
                {RANKED.map((row, i) => (
                  <span
                    key={row.name}
                    className={styles.tr}
                    style={{ "--b": s(T.table + 0.1 + 0.08 * i) } as CSSProperties}
                  >
                    <span>{row.name}</span>
                    <span className={styles.num}>{row.actual}</span>
                    <span className={styles.num}>{row.rate}</span>
                    <span>
                      <span
                        className={`${styles.status} ${row.met ? "" : styles.statusMiss}`.trim()}
                      >
                        <i />
                        {row.met ? "At or above target" : "Below target"}
                      </span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
