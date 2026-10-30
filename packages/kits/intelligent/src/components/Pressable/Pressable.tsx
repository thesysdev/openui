"use client";

import { type KeyboardEvent, type MouseEvent, type ReactNode, useRef } from "react";
import { bg, cx, onColor, radius as radiusOf, space, type Color, type Radius } from "../../shared/style";

export interface PressableProps {
  /** Called with the tile's element, e.g. to read its text. */
  onPress?: (element: HTMLDivElement | null) => void;
  /** Shows a light wash, a ring and a check badge; undefined leaves aria-pressed off. */
  selected?: boolean;
  /** Ignores presses, e.g. while the answer is still streaming. */
  disabled?: boolean;
  /** Padding in 4px steps. */
  padding?: number;
  background?: Color;
  radius?: Radius;
  children?: ReactNode;
}

/** Makes any content clickable, such as a tile or a swatch. */
export function Pressable({ onPress, selected, disabled, padding, background, radius, children }: PressableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const press = () => {
    if (!disabled) onPress?.(ref.current);
  };
  // Clicks meant for a control inside the tile stay with that control.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as Element).closest("button,a,input,select,textarea,label,[role=button]");
    if (target === event.currentTarget) press();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    press();
  };
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-pressed={selected === undefined ? undefined : !!selected}
      aria-disabled={disabled || undefined}
      className={cx("openui-intelligent-pressable", selected && "is-selected")}
      style={{ padding: space(padding), background: bg(background), ...onColor(background), borderRadius: radiusOf(radius) }}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}
