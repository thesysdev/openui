import type { CSSProperties } from "react";
import styles from "./GradientDivider.module.css";

const BAR_HEIGHTS = [
  60, 48, 32, 20.942, 16.754, 12.565, 10.471, 8.377, 6.283, 4.188, 3.141, 2.094, 1.047,
];

export function GradientDivider({ direction = "down" }: { direction?: "down" | "up" }) {
  const bars = direction === "up" ? [...BAR_HEIGHTS].reverse() : BAR_HEIGHTS;

  return (
    <div className={styles.divider}>
      {bars.map((h) => (
        <div
          key={h}
          className={styles.bar}
          style={{ "--bar-h-mobile": `${h / 2}px`, "--bar-h": `${h}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
