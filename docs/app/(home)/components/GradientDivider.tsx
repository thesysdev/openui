import type { CSSProperties } from "react";

const BAR_HEIGHTS = [
  60, 48, 32, 20.942, 16.754, 12.565, 10.471, 8.377, 6.283, 4.188, 3.141, 2.094, 1.047,
];

export function GradientDivider({ direction = "down" }: { direction?: "down" | "up" }) {
  const bars = direction === "up" ? [...BAR_HEIGHTS].reverse() : BAR_HEIGHTS;

  return (
    <div className="w-full flex flex-col rotate-180 gap-[2px] lg:gap-[6px]">
      {bars.map((h) => (
        <div
          key={h}
          className="bg-black/4 w-full shrink-0 h-[var(--bar-h-mobile)] lg:h-[var(--bar-h)]"
          style={{ "--bar-h-mobile": `${h / 2}px`, "--bar-h": `${h}px` } as CSSProperties}
        />
      ))}
    </div>
  );
}
