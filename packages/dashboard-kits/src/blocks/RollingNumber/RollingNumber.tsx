import { useEffect, useState } from "react";

/**
 * A formatted value whose digits roll into place: up from zero when it first
 * shows, and from the old value to the new one when a filter changes it.
 */
export function RollingNumber({ value, className }: { value: string; className?: string }) {
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const chars = [...(shown ?? value.replace(/\d/g, "0"))];
  return (
    <span className={`kit-roll${className ? ` ${className}` : ""}`}>
      <span className="kit-sr">{value}</span>
      <span className="kit-roll__chars" aria-hidden>
        {chars.map((ch, i) => {
          // Keyed from the right, so units and suffixes keep their place.
          const position = chars.length - i;
          if (!/\d/.test(ch)) {
            return (
              <span key={`c${position}`} className="kit-roll__char">
                {ch}
              </span>
            );
          }
          return (
            <span key={`d${position}`} className="kit-roll__digit">
              <span
                className="kit-roll__strip"
                style={{ transform: `translateY(${-Number(ch) * 10}%)` }}
              >
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
