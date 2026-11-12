"use client";

export type StatusIconProps = {
  tone: "good" | "bad" | "warning" | "info" | "neutral";
  bare?: boolean;
};

/**
 * A state as a soft tile in the tone's colour with a shape inside (circle
 * good, triangle warning, diamond bad), sized in em to follow its text. Table
 * status chips use the bare icon instead: check, !, ×, i, –.
 */
export function StatusIcon({ tone, bare }: StatusIconProps) {
  // bare: the shape on its own, for a status chip that is already tinted.
  if (bare)
    return (
      <span className={`openui-dashboard-status-shape openui-dashboard-status-${tone}`} aria-hidden>
        <span />
      </span>
    );
  // The tile carries a shape: circle good, triangle warning, diamond bad, square info, bar neutral.
  return (
    <span className={`openui-dashboard-status-icon openui-dashboard-status-${tone}`} aria-hidden>
      <span />
    </span>
  );
}
