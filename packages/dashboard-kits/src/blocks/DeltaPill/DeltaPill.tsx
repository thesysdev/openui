import { changeTone, formatChange } from "../../core/format";

/** Signed change against the prior period, colored by whether that direction is good. */
export function DeltaPill({
  change,
  goodDirection = "up",
  suffix = "%",
}: {
  change?: number;
  goodDirection?: "up" | "down" | "neutral";
  suffix?: string;
}) {
  if (change == null) return null;
  const tone = changeTone(change, goodDirection);
  const text =
    suffix === "%"
      ? formatChange(change).replace(/^[+−]/, "")
      : `${Math.abs(change).toFixed(1)}${suffix}`;
  return (
    <span className={`kit-delta kit-delta--${tone}`}>
      <svg viewBox="0 0 10 10" aria-hidden className={change < 0 ? "kit-delta__down" : ""}>
        <path d="M5 2 L8.5 7 H1.5 Z" />
      </svg>
      {text}
      <span className="kit-sr">{change < 0 ? " down" : " up"}</span>
    </span>
  );
}
