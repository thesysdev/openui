"use client";

export type RampKeyProps = {
  low: string;
  high: string;
  ramp: "seq" | "div";
  className?: string;
};

/**
 * The colour key for a ramp: its low end, the ramp's five steps, its high end. Sits above a grid, as
 * legends do (openui-dashboard-ramp-key), or under a map (openui-dashboard-geo-legend).
 */
export function RampKey({
  low,
  high,
  ramp,
  className = "openui-dashboard-ramp-key",
}: RampKeyProps) {
  return (
    <div className={`openui-dashboard-legend ${className}`}>
      <span>{low}</span>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0, 2, 4, 6, 8].map((step) => (
          <span
            key={step}
            style={{
              width: 18,
              height: 8,
              borderRadius: 2,
              background: `var(--openui-dashboard-${ramp}-${step + 1})`,
            }}
          />
        ))}
      </span>
      <span>{high}</span>
    </div>
  );
}
