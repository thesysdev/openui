import {
  ArrowRight,
  ClockCounterClockwise,
  DotsThree,
  FunnelSimple,
  MagnifyingGlass,
  Play,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import styles from "./FeatureMockups.module.css";

const REVIEW_ITEMS = [
  { title: "Total should match finance", meta: "High · Data", selected: true },
  { title: "Small regions need a minimum bar height", meta: "Low · UI", selected: false },
  { title: "Export to PDF is still missing", meta: "High · Missing", selected: false },
] as const;

function ConsoleNav({ active }: { active: "Review" | "Sessions" }) {
  return (
    <div className={styles.consoleNav}>
      <span className={styles.consoleMark}>O</span>
      <span className={active === "Sessions" ? styles.activeNav : undefined}>Sessions</span>
      <span>Users</span>
      <span>Insights</span>
      <span className={active === "Review" ? styles.activeNav : undefined}>Review</span>
    </div>
  );
}

export function TriageMockup() {
  return (
    <div
      className={styles.canvas}
      aria-label="The Review queue with a production issue selected for triage"
    >
      <div className={styles.window}>
        <ConsoleNav active="Review" />
        <div className={styles.triageBody}>
          <section className={styles.reviewList}>
            <div className={styles.reviewHeader}>
              <span>
                <strong>Review</strong>
                <i>20</i>
              </span>
              <button type="button" tabIndex={-1}>
                <FunnelSimple size={14} /> Recency
              </button>
            </div>
            <p className={styles.monthRow}>
              July 2026 <span>12</span>
            </p>
            <div className={styles.reviewItems}>
              {REVIEW_ITEMS.map((item) => (
                <article
                  className={item.selected ? styles.selectedReview : undefined}
                  key={item.title}
                >
                  <span className={styles.issueBadge}>
                    <WarningCircle size={11} weight="fill" />
                    Issue
                  </span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                  <ArrowRight size={13} aria-hidden="true" />
                </article>
              ))}
            </div>
          </section>

          <section className={styles.issueDrawer}>
            <div className={styles.drawerTopline}>
              <span>Issue overview</span>
              <span className={styles.highBadge}>High</span>
            </div>
            <h3>Total should match finance</h3>
            <p className={styles.issueSummary}>
              The card reads $2.15M while the finance dashboard shows $2.19M for the same range.
            </p>
            <div className={styles.evidenceGrid}>
              <div>
                <small>User asked</small>
                <p>Show revenue for the last six months.</p>
              </div>
              <div>
                <small>User saw</small>
                <p>$2.15M total with no mismatch warning.</p>
              </div>
            </div>
            <div className={styles.reviewerNote}>
              <small>Expected behaviour</small>
              <p>Use the finance total and keep the chart range unchanged.</p>
            </div>
            <div className={styles.drawerFooter}>
              <span>
                <b>8</b> related occurrences
              </span>
              <button className={styles.openSession} type="button" tabIndex={-1}>
                Open session <ArrowRight size={13} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function EvalsMockup() {
  return (
    <div className={styles.canvas} aria-label="The Evals product page with a failed case selected">
      <div className={`${styles.window} ${styles.evalWindow}`}>
        <header className={styles.productTopbar}>
          <span>
            <strong>OpenUI Cloud</strong> by Thesys
          </span>
          <span className={styles.topbarActions}>
            <button type="button" tabIndex={-1}>
              Help
            </button>
            <button type="button" tabIndex={-1}>
              Docs ↗
            </button>
            <i>PA</i>
          </span>
        </header>

        <div className={styles.productBody}>
          <aside className={styles.productSidebar}>
            <div className={styles.appSwitcher}>
              <span>▦</span> My Analytics app <small>⌄</small>
            </div>
            <span className={styles.sidebarItem}>Home</span>
            <p>Observe</p>
            {["Sessions", "Users", "Insights", "Review", "Evals"].map((item) => (
              <span
                className={item === "Evals" ? styles.sidebarActive : styles.sidebarItem}
                key={item}
              >
                {item}
                {item === "Review" && <small>20</small>}
              </span>
            ))}
            <p>Debug</p>
            <span className={styles.sidebarItem}>Reliability</span>
            <span className={styles.sidebarItem}>Performance</span>
          </aside>

          <main className={styles.evalsMain}>
            <div className={styles.evalsHeading}>
              <span>
                <h3>Evals</h3>
                <p>Catch regressions before they reach users.</p>
              </span>
              <button className={styles.runButton} type="button" tabIndex={-1}>
                <Play size={10} weight="fill" /> Run evals
              </button>
            </div>

            <div className={styles.evalMetrics}>
              <span>
                <b>24</b>
                <small>Cases</small>
              </span>
              <span>
                <b>87.5%</b>
                <small>Pass rate</small>
              </span>
              <span>
                <b className={styles.regressionCount}>3</b>
                <small>Regressions</small>
              </span>
              <span>
                <b>8m ago</b>
                <small>Last run</small>
              </span>
            </div>

            <div className={styles.evalWorkspace}>
              <section className={styles.evalList}>
                <div className={styles.evalToolbar}>
                  <button type="button" tabIndex={-1}>
                    Production dashboards (July)⌄
                  </button>
                  <span>
                    <MagnifyingGlass size={10} /> Search cases
                  </span>
                  <button type="button" tabIndex={-1}>
                    All status⌄
                  </button>
                </div>
                <div className={styles.evalTableHeader}>
                  <span>Eval</span>
                  <span>Source</span>
                  <span>Result</span>
                  <span>Last run</span>
                </div>
                {[
                  ["Finance total matches source", "Session", "Failed", "8m"],
                  ["Regional breakdown is included", "Review", "Passed", "8m"],
                  ["Export follows on-screen filters", "Session", "Passed", "1d"],
                  ["Small regions remain readable", "Review", "Not run", "—"],
                ].map(([name, source, result, time], index) => (
                  <article
                    className={index === 0 ? styles.evalRowSelected : styles.evalRow}
                    key={name}
                  >
                    <span>
                      <b>{name}</b>
                      <small>
                        {index === 0 ? "Added from Olivia’s session" : "Production case"}
                      </small>
                    </span>
                    <small>{source}</small>
                    <i data-result={result}>{result}</i>
                    <small>{time}</small>
                  </article>
                ))}
              </section>

              <aside className={styles.evalDetail}>
                <div className={styles.evalDetailTop}>
                  <span>
                    <i>Failed</i>
                    <small>EV-024</small>
                  </span>
                  <DotsThree size={14} />
                </div>
                <h4>Finance total matches source</h4>
                <p className={styles.evalSource}>From West Coast renewal-risk dashboard ↗</p>
                <div className={styles.evalContext}>
                  <small>User asked</small>
                  <p>Show revenue for the last six months.</p>
                  <small>Expected behaviour</small>
                  <p>Use the finance total and preserve the selected date range.</p>
                </div>
                <div className={styles.runComparison}>
                  <span>
                    <small>Production</small>
                    <b>$2.15M</b>
                    <i>Failed</i>
                  </span>
                  <ArrowRight size={11} />
                  <span>
                    <small>Prompt v14</small>
                    <b>$2.19M</b>
                    <i>Passed</i>
                  </span>
                </div>
                <button className={styles.historyButton} type="button" tabIndex={-1}>
                  <ClockCounterClockwise size={10} /> View run history
                </button>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
