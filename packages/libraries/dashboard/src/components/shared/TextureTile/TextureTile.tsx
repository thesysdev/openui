"use client";

import { textureOf, TEXTURES } from "../../../shared/colors";

export type TextureTileProps = {
  id: string;
  index: number;
  base?: string;
  baseOpacity?: string;
  ink: string;
  opacity: string;
};

/**
 * One texture tile (see TEXTURES): its size and turn, an optional base fill,
 * then its marks in `ink` at `opacity`. Dots sit on a 45° lattice; the line
 * textures are one 0.9px rule turned 45°, -45°, 90° or 0°; crosshatch is two.
 */
export function TextureTile({ id, index, base, baseOpacity, ink, opacity }: TextureTileProps) {
  const kind = TEXTURES[textureOf(index)]!;
  const size = kind === "dots" ? 6 : kind === "crosshatch" ? 5 : 4.5;
  const turn = {
    dots: 45,
    slash: 45,
    "back-slash": -45,
    horizontal: 90,
    crosshatch: 45,
    vertical: 0,
  }[kind];
  const mark = { opacity };
  return (
    <pattern
      id={id}
      width={size}
      height={size}
      patternUnits="userSpaceOnUse"
      patternTransform={turn ? `rotate(${turn})` : undefined}
    >
      {base ? (
        <rect
          width={size}
          height={size}
          fill={base}
          style={baseOpacity ? { opacity: baseOpacity } : undefined}
        />
      ) : null}
      {kind === "dots" ? (
        <circle cx="1.8" cy="1.8" r="0.8" fill={ink} style={mark} />
      ) : (
        <line x1="0" y1="0" x2="0" y2={size} stroke={ink} strokeWidth="0.9" style={mark} />
      )}
      {kind === "crosshatch" ? (
        <line x1="0" y1="0" x2={size} y2="0" stroke={ink} strokeWidth="0.9" style={mark} />
      ) : null}
    </pattern>
  );
}
