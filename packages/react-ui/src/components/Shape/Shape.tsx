import clsx from "clsx";

export type ShapeKind =
  | "circle"
  | "square"
  | "diamond"
  | "triangle-up"
  | "triangle-down"
  | "triangle-left"
  | "triangle-right"
  | "hexagon";

export type ShapeColor =
  "neutral" | "info" | "success" | "warning" | "danger" | "purple" | "pink" | "inverted";

export interface ShapeProps {
  shape: ShapeKind;
  color?: ShapeColor;
  /** Accessible label; omit when the shape is decorative. */
  label?: string;
  className?: string;
}

// Drawn in a 24-unit box with ~3 units of padding, like a lucide icon, so a
// shape sits at the same visual size as an Icon in the same slot.
const PATHS: Record<ShapeKind, string> = {
  circle: "M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16Z",
  square: "M6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z",
  diamond: "M12 3.5l8.5 8.5l-8.5 8.5l-8.5-8.5Z",
  "triangle-up": "M12 4.5l8.5 14.5h-17Z",
  "triangle-down": "M12 19.5l8.5-14.5h-17Z",
  "triangle-left": "M4.5 12l14.5-8.5v17Z",
  "triangle-right": "M19.5 12l-14.5-8.5v17Z",
  hexagon: "M12 3.5l7.5 4.25v8.5l-7.5 4.25l-7.5-4.25v-8.5Z",
};

/** A small solid shape, a sibling of Icon, for color-coded markers. */
export const Shape = ({ shape, color = "neutral", label, className }: ShapeProps) => (
  <svg
    className={clsx("openui-shape", `openui-shape--${color}`, className)}
    viewBox="0 0 24 24"
    width={16}
    height={16}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <path d={PATHS[shape] ?? PATHS.circle} fill="currentColor" stroke="none" />
  </svg>
);
