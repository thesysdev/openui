"use client";

import { DriverAvatar } from "../f1-assets";
import { findDriver } from "../f1-genui";

/**
 * A driver's headshot by code. A driver the 2026 assets don't have (a stand-in, or someone who
 * raced earlier in the season) gets a placeholder: their code on the team colour, same size.
 */
export function Avatar({ code, size, teamColour }: { code: string; size: number; teamColour?: string | null }) {
  const d = findDriver(code);
  if (d) return <DriverAvatar number={d.number} size={size} showHeadshot />;
  return (
    <span
      className="f1d-avatar-placeholder"
      aria-hidden
      style={{ width: size, height: size, background: teamColour ?? "#949498", fontSize: size * 0.3 }}
    >
      {code.slice(0, 3)}
    </span>
  );
}
