import chartStyles from "@/components/charts/viz.module.css";
import { failureTaxonomy } from "@/lib/benchmark-data";
import styles from "./FailureBreakdown.module.css";

// Exact chart textures exported from the reviewed Figma design.
const fills = [
  styles.failureFill,
  styles.referenceFill,
  styles.argumentFill,
  styles.truncationFill,
];

const total = failureTaxonomy.reduce((sum, entry) => sum + entry.share, 0);
const categories = failureTaxonomy.map((entry, index) => ({
  ...entry,
  label: entry.family.replace(/\s*\(.*\)\s*$/, ""),
  midpoint:
    ((failureTaxonomy.slice(0, index).reduce((sum, item) => sum + item.share, 0) +
      entry.share / 2) /
      total) *
    1000,
  labelPosition: (index / failureTaxonomy.length) * 1000,
  mobileLabelPosition: ((index + 0.5) / failureTaxonomy.length) * 1000,
}));

export function FailureBreakdown() {
  return (
    <figure
      className={`${chartStyles.viz} ${styles.figure}`}
      aria-label="Failure categories as a percentage of failed generations"
    >
      <div className={styles.chartBody}>
        <div
          className={styles.bar}
          style={{
            gridTemplateColumns: categories.map((entry) => `${entry.share}fr`).join(" "),
            gridTemplateRows: categories.map((entry) => `${entry.share}fr`).join(" "),
          }}
          aria-hidden="true"
        >
          {categories.map((entry, index) => (
            <span key={entry.family} className={`${styles.segment} ${fills[index]}`} />
          ))}
        </div>

        {/* Ordered anchors and equal-size label slots keep the connectors from
            crossing, even when a segment is too small to contain its label. */}
        <div className={styles.connectors} aria-hidden="true">
          <svg
            className={styles.horizontalConnectors}
            viewBox="0 0 1000 72"
            preserveAspectRatio="none"
          >
            {categories.map((entry, index) => (
              <path
                key={entry.family}
                d={`M ${entry.midpoint} 0 V ${18 + index * 12} H ${entry.labelPosition} V 72`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          <svg
            className={styles.verticalConnectors}
            viewBox="0 0 64 1000"
            preserveAspectRatio="none"
          >
            {categories.map((entry, index) => (
              <path
                key={entry.family}
                d={`M 0 ${entry.midpoint} H ${12 + index * 12} V ${entry.mobileLabelPosition} H 64`}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>

        <ul className={styles.labels}>
          {categories.map((entry) => (
            <li key={entry.family} className={styles.label}>
              <span className={styles.share}>{entry.share}%</span>
              <span className={styles.family}>
                {entry.label === "Enum, type and argument errors" ? (
                  <>
                    Enum, type and
                    <br />
                    argument errors
                  </>
                ) : (
                  entry.label
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
