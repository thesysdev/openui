import clsx from "clsx";
import { Children, type ReactNode } from "react";

export type AvatarStackSize = "inline" | "md" | "lg";

export interface AvatarStackProps {
  /** Avatar elements, already sized to `size`. */
  children: ReactNode;
  size?: AvatarStackSize;
  /** Extra avatars beyond those shown, rendered as a count chip. */
  overflow?: number;
  /** Shape of each child, so each cutout matches the avatar that overlaps it. */
  shapes?: ("circle" | "rounded")[];
  className?: string;
}

/**
 * Avatars overlapped left to right, the first on top. Each later one is
 * masked with a cutout shaped like the avatar before it (circle or rounded
 * square) plus a thin gap, so edges stay clean on any background without
 * outlines, and every avatar's visible side stays whole.
 */
export const AvatarStack = ({
  children,
  size = "md",
  overflow = 0,
  shapes = [],
  className,
}: AvatarStackProps) => {
  const items = Children.toArray(children).filter(Boolean);
  const total = items.length + (overflow > 0 ? 1 : 0);
  // Each item is cut by the one before it (which sits on top).
  const prevShape = (i: number) => shapes[i - 1] ?? "circle";
  return (
    <span className={clsx("openui-avatar-stack", `openui-avatar-stack--${size}`, className)}>
      {items.map((child, i) => (
        <span
          key={i}
          className={clsx(
            "openui-avatar-stack__item",
            i > 0 && `openui-avatar-stack__item--cut-${prevShape(i)}`,
          )}
          style={{ zIndex: total - i }}
        >
          {child}
        </span>
      ))}
      {overflow > 0 && (
        <span
          className={clsx(
            "openui-avatar-stack__item",
            "openui-avatar-stack__more",
            items.length > 0 && `openui-avatar-stack__item--cut-${prevShape(items.length)}`,
          )}
        >
          <span className="openui-avatar-stack__sr">{overflow} more</span>
          <span aria-hidden>{overflow}</span>
        </span>
      )}
    </span>
  );
};
