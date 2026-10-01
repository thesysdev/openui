"use client";

import { useEffect, useState, type CSSProperties } from "react";

/*
 * Texture: a printed-paper overlay (halftone dots + fine grain) drawn procedurally
 * onto a small seamless tile, then repeated over its parent. Put it last inside a
 * `position: relative` box. Two layers: ink dots that darken light surfaces, and
 * paper specks that lift dark surfaces, so the print shows on red and carbon alike.
 */

export type TextureProps = {
  /** Dot and grain colour that darkens light areas. */
  ink?: string;
  /** Speck colour that lightens dark areas. */
  paper?: string;
  /** Distance between halftone dots, in CSS pixels. */
  dotSpacing?: number;
  /** 0–1: how large the dots get where the pattern is densest. */
  dotSize?: number;
  /** 0–1: amount of per-pixel grain. */
  grain?: number;
  /** How the ink layer mixes in. "color-burn" keeps pure white clean but tints off-whites. */
  blend?: CSSProperties["mixBlendMode"];
  /** 0–1: overall strength. */
  opacity?: number;
  style?: CSSProperties;
  /** Extra style for each texture layer, e.g. a CSS mask so the print only lands on certain shapes. */
  layerStyle?: CSSProperties;
};

const TILE_CELLS = 48;
const WRAP = [-1, 0, 1].flatMap((a) => [-1, 0, 1].map((b) => [a, b]));

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function drawTile(spacing: number, dotSize: number, grain: number, ink: string, paper: string, speck: boolean) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cellPx = spacing * dpr;
  const size = Math.round(TILE_CELLS * cellPx);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const [r, g, b] = hexToRgb(speck ? paper : ink);

  // Halftone: a 45° lattice (square grid plus its centre points) wraps cleanly at the tile edge.
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  for (let j = 0; j < TILE_CELLS * 2; j++) {
    for (let i = 0; i < TILE_CELLS; i++) {
      const x = (i + (j % 2) * 0.5) * cellPx;
      const y = j * 0.5 * cellPx;
      const f = Math.random();
      const radius = cellPx * 0.32 * dotSize * (0.8 + 0.4 * f);
      if (radius < 0.35) continue;
      for (const [ox, oy] of WRAP.map(([a, b]) => [a * size, b * size])) {
        ctx.beginPath();
        ctx.arc(x - ox, y - oy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Grain: random per-pixel alpha, sparse for the paper layer.
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const noise = Math.random();
    const grainAlpha = speck ? (noise > 0.985 ? 110 * grain : 0) : noise * 30 * grain;
    const dotAlpha = d[p + 3] * (speck ? 0.16 : 0.26);
    d[p] = r;
    d[p + 1] = g;
    d[p + 2] = b;
    d[p + 3] = Math.min(255, dotAlpha + grainAlpha);
  }
  ctx.putImageData(img, 0, 0);
  return { url: canvas.toDataURL("image/png"), cssSize: size / dpr };
}

export function Texture({
  ink = "#15151E",
  paper = "#F7F4F1",
  dotSpacing = 4,
  dotSize = 0.9,
  grain = 0.6,
  blend = "multiply",
  opacity = 1,
  style,
  layerStyle,
}: TextureProps) {
  const [tiles, setTiles] = useState<{ ink: string; paper: string; size: number } | null>(null);

  useEffect(() => {
    const a = drawTile(dotSpacing, dotSize, grain, ink, paper, false);
    const b = drawTile(dotSpacing, dotSize, grain, ink, paper, true);
    setTiles({ ink: a.url, paper: b.url, size: a.cssSize });
  }, [ink, paper, dotSpacing, dotSize, grain]);

  if (!tiles) return null;
  const layer = (url: string, blend: CSSProperties["mixBlendMode"]): CSSProperties => ({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: `url(${url})`,
    backgroundSize: `${tiles.size}px ${tiles.size}px`,
    mixBlendMode: blend,
    opacity,
    ...layerStyle,
  });

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <div style={layer(tiles.ink, blend)} />
      <div style={layer(tiles.paper, "screen")} />
    </div>
  );
}
