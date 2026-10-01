"use client";

import { useId, useMemo } from "react";
import { FACETS, PALETTE, VIEW_BOX, type Fill, type Stop } from "./car-3d-paths";

/*
 * Car3DGloss: a copy of the first Car3D, kept as it was before the matte finish and the house
 * print went on, so the two can be compared and the painted look is never lost. A top-down F1
 * car, nose pointing down, built from the painted reference's own facet geometry (car-3d-paths.ts,
 * shared with Car3D). Every painted fill is stored as a role plus its saturation and lightness,
 * so the orange family becomes shades of `colour`, the dark greys become shades of `carbon`, the
 * lime helmet becomes shades of `helmet`, and the painted shadow layers stay put. SVG filters
 * add a ground shadow and a fine grain on top.
 */

export type Car3DGlossProps = {
  /** Team accent: nose, engine-cover spine, rear wing, sidepod flashes. */
  colour?: string;
  /** Body, floor, tyres and wings. */
  carbon?: string;
  helmet?: string;
  width?: number;
  /** Ground shadow under the car. Turn off when the car sits on something that draws its own. */
  shadow?: boolean;
  /** Fine paper grain over the paint. */
  grain?: boolean;
  title?: string;
  style?: React.CSSProperties;
};

// The reference's own base tones for each role. A prop equal to its base reproduces the painting.
const BASE = { a: "#F3872F", c: "#2C323A", h: "#E7EC4C" } as const;

function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

type Paint = { solid: [string, number] } | { grad: [[string, number], [string, number]]; box: [number, number, number, number] };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Re-express a painted fill (its saturation and lightness) relative to a new base colour: the
// hue comes from the prop, saturation scales with it, and lightness keeps the painted contrast
// above and below the base.
function tint(role: "a" | "c" | "h", s: number, l: number, prop: string) {
  const [, bs, bl] = hexToHsl(BASE[role]);
  const [ph, ps, pl] = hexToHsl(prop);
  const sat = bs ? clamp01(ps * (s / bs)) : ps;
  const light = clamp01(pl + (l - bl) * (l > bl ? (1 - pl) / (1 - bl) : pl / bl));
  return hslToHex(ph, sat, light);
}

export function Car3DGloss({
  colour = "#E10600",
  carbon = "#15151E",
  helmet = "#F2C230",
  width = 200,
  shadow = true,
  grain = true,
  title,
  style,
}: Car3DGlossProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  const paint = useMemo(() => {
    const props = { a: colour, c: carbon, h: helmet };
    const stop = (st: Stop): [string, number] =>
      st[0] === "k" ? [st[1], st[2]] : [tint(st[0], st[1], st[2], props[st[0]]), 1];
    return PALETTE.map((fill: Fill): Paint =>
      fill[0] === "g" ? { grad: [stop(fill[1]), stop(fill[2])], box: fill[3] } : { solid: stop(fill) },
    );
  }, [colour, carbon, helmet]);

  return (
    <svg
      viewBox={VIEW_BOX}
      width={width}
      height={(width * 1225) / 760}
      role="img"
      aria-label={title ?? "F1 car, top view"}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <defs>
        {paint.map((p, i) =>
          "grad" in p ? (
            <linearGradient key={i} id={id(`g${i}`)} gradientUnits="userSpaceOnUse" x1={p.box[0]} y1={p.box[1]} x2={p.box[2]} y2={p.box[3]}>
              <stop offset="0" stopColor={p.grad[0][0]} stopOpacity={p.grad[0][1]} />
              <stop offset="1" stopColor={p.grad[1][0]} stopOpacity={p.grad[1][1]} />
            </linearGradient>
          ) : null,
        )}
        {/* Two-layer ground shadow: a wide soft pool plus a tight contact shadow. */}
        <filter id={id("ground")} x="-30%" y="-20%" width="160%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="22" result="wide" />
          <feOffset in="wide" dx="10" dy="24" result="wideOff" />
          <feFlood floodColor="#000000" floodOpacity="0.35" />
          <feComposite in2="wideOff" operator="in" result="pool" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="tight" />
          <feOffset in="tight" dx="3" dy="6" result="tightOff" />
          <feFlood floodColor="#000000" floodOpacity="0.4" />
          <feComposite in2="tightOff" operator="in" result="contact" />
          <feMerge>
            <feMergeNode in="pool" />
            <feMergeNode in="contact" />
          </feMerge>
        </filter>
        {/* Grain: fine noise kept inside the car's own alpha. */}
        <filter id={id("grain")} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0" result="speck" />
          <feComposite in="speck" in2="SourceAlpha" operator="in" result="speckIn" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="speckIn" />
          </feMerge>
        </filter>
      </defs>

      {title ? <title>{title}</title> : null}

      {shadow ? (
        <g filter={url("ground")}>
          {FACETS.map(([k, d], i) => {
            const p = paint[k];
            return "solid" in p && p.solid[1] < 1 ? null : <path key={i} d={d} />;
          })}
        </g>
      ) : null}

      <g filter={grain ? url("grain") : undefined}>
        {FACETS.map(([k, d], i) => {
          const p = paint[k];
          return "grad" in p ? (
            <path key={i} d={d} fill={url(`g${k}`)} />
          ) : (
            <path key={i} d={d} fill={p.solid[0]} fillOpacity={p.solid[1] < 1 ? p.solid[1] : undefined} />
          );
        })}
      </g>
    </svg>
  );
}

const liveries = [
  { name: "F1 red", colour: "#E10600", carbon: "#15151E", helmet: "#F2C230" },
  { name: "McLaren", colour: "#FF8000", carbon: "#1B1F2A", helmet: "#D4F20C" },
  { name: "Ferrari", colour: "#E8002D", carbon: "#1A0E10", helmet: "#F7F4F1" },
  { name: "Mercedes", colour: "#27F4D2", carbon: "#101418", helmet: "#C8CCD4" },
  { name: "Red Bull", colour: "#FFC906", carbon: "#1A2238", helmet: "#E10600" },
  { name: "Aston Martin", colour: "#CEDC00", carbon: "#0B3B32", helmet: "#F7F4F1" },
];

export function Car3DGlossPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Car3DGloss in the painted colours, and the default</h3>
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <Car3DGloss width={240} colour="#F3872F" carbon="#2C323A" helmet="#E7EC4C" shadow={false} grain={false} title="As painted" />
          <Car3DGloss width={240} title="Default F1 red" />
        </div>
      </section>
      <section className="ref-group">
        <h3>Team colours</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
          {liveries.map((l) => (
            <div key={l.name} style={{ display: "grid", justifyItems: "center", gap: 12 }}>
              <Car3DGloss colour={l.colour} carbon={l.carbon} helmet={l.helmet} width={150} title={`${l.name} car`} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>On carbon, and small</h3>
        <div style={{ background: "#15151E", borderRadius: 8, padding: 32, display: "flex", gap: 48, alignItems: "flex-end", justifyContent: "center" }}>
          <Car3DGloss width={180} />
          <Car3DGloss width={180} colour="#FF8000" carbon="#1B1F2A" helmet="#D4F20C" />
          <Car3DGloss width={80} colour="#27F4D2" carbon="#101418" />
          <Car3DGloss width={40} />
        </div>
      </section>
      <p className="ref-note">
        The painted (watercolour) Car3D, kept as a copy before the matte finish and house print went on.{" "}
        <code>{'<Car3DGloss colour="#FF8000" carbon="#1B1F2A" width={200} />'}</code> Props: <code>colour</code>,{" "}
        <code>carbon</code>, <code>helmet</code>, <code>width</code>, <code>shadow</code>, <code>grain</code>, <code>title</code>.
      </p>
    </div>
  );
}
