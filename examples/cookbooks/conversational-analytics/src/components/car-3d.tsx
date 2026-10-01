"use client";

import { useId, useMemo } from "react";
import { FACETS, PALETTE, VIEW_BOX, type Fill, type Stop } from "./car-3d-paths";

/*
 * Car3D: a top-down F1 car, nose pointing down, built from the painted reference's own facet
 * geometry (see car-3d-paths.ts). Every painted fill is stored as a role plus its saturation and
 * lightness, so the orange family becomes shades of `colour`, the dark greys become shades of
 * `carbon`, the lime helmet becomes shades of `helmet`, and the painted shadow layers stay put.
 * The default "matte" finish flattens the painting's wet highlights and lays the same halftone
 * print as Texture over the paint (ink dots on the light areas, paper specks on the dark), so
 * the car sits in the house print style; "gloss" keeps the reference's watercolour finish.
 */

export type Car3DProps = {
  /** Team accent: nose, engine-cover spine, rear wing, sidepod flashes. */
  colour?: string;
  /** Body, floor, tyres and wings. */
  carbon?: string;
  helmet?: string;
  width?: number;
  /** "matte" (default) flattens highlights and washes to the house print look; "gloss" keeps the painted finish. */
  finish?: "matte" | "gloss";
  /** Ground shadow under the car. Turn off when the car sits on something that draws its own. */
  shadow?: boolean;
  /** The Texture print (halftone ink dots, grain, paper specks) laid over the paint. */
  texture?: boolean;
  /** Print ink colour, darkening the light areas. */
  ink?: string;
  /** Print speck colour, lifting the dark areas. */
  paper?: string;
  /** Distance between halftone dots, in CSS pixels at the given width. */
  dotSpacing?: number;
  /** The two tones of the motion streaks, or false to keep them as painted. Defaults to the accent colour with
   * cyan, or with magenta when the accent is itself a cyan or teal. */
  streaks?: [string, string] | false;
  /** How far the two streak tones are pulled apart, in CSS pixels at the given width. */
  streakOffset?: number;
  title?: string;
  style?: React.CSSProperties;
};

// The reference's own base tones for each role. A prop equal to its base reproduces the painting.
const BASE = { a: "#F3872F", c: "#2C323A", h: "#E7EC4C" } as const;

// Matte finish: how much of the painted lightness above and below the base survives, how strong
// the translucent shadow washes stay, and how much the accent and helmet are brightened to make
// up for the ink the print lays over them (the dots and grain mute a flat colour by roughly 12%).
const MATTE = { up: 0.65, down: 0.85, wash: 0.85, lift: 0.07, punch: 0.1 };

// Facets of the painted motion streaks: the feathered strokes trailing along both sidepod flanks
// from the rear tyres to the front ones. Found as the translucent facets that lie mostly outside
// the body silhouette. They are redrawn as two offset tones, like a misregistered print.
const STREAKS = new Set([
  524, 533, 536, 541, 554, 562, 564, 568, 569, 570, 572, 573, 576, 582, 583, 584, 585, 587, 588, 589, 590, 592, 593,
  594, 596, 597, 598, 602, 606, 607,
]);

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

// "r g b" channel values in 0–1 for feColorMatrix constants.
const rgb01 = (hex: string) => [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));

type Paint = { solid: [string, number] } | { grad: [[string, number], [string, number]]; box: [number, number, number, number] };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Brighten a colour for the matte finish: a little lighter and a little more saturated, scaled by
// `amount` (1 under the full print, less without it).
function brighten(hex: string, amount: number) {
  if (!amount) return hex;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, clamp01(s * (1 + MATTE.punch * amount)), clamp01(l + MATTE.lift * amount));
}

// Re-express a painted fill (its saturation and lightness) relative to a new base colour: the
// hue comes from the prop, saturation scales with it, and lightness keeps the painted contrast
// above and below the base, compressed for the matte finish.
function tint(role: "a" | "c" | "h", s: number, l: number, prop: string, finish: "matte" | "gloss") {
  const [, bs, bl] = hexToHsl(BASE[role]);
  const [ph, ps, pl] = hexToHsl(prop);
  const up = l > bl;
  const keep = finish === "matte" ? (up ? MATTE.up : MATTE.down) : 1;
  const sat = bs ? clamp01(ps * (s / bs)) : ps;
  const light = clamp01(pl + (l - bl) * keep * (up ? (1 - pl) / (1 - bl) : pl / bl));
  return hslToHex(ph, sat, light);
}

// The misprint's second tone: cyan, unless the accent is already a cyan or teal, then magenta.
function secondTone(accent: string) {
  const hue = hexToHsl(accent)[0] * 360;
  return Math.abs(hue - 195) < 60 ? "#FF2FB5" : "#00B2E3";
}

// One 2x2-cell tile of the Texture halftone: a 45° lattice (cell corners plus centres) with the
// dot radii nudged so the print doesn't read as a perfect grid. Edge dots repeat on the far edges
// so the tile wraps.
function halftoneTile(ink: string) {
  const r = 0.29;
  const dots: [number, number, number][] = [
    [0, 0, 1], [2, 0, 1], [0, 2, 1], [2, 2, 1], [1, 0, 0.85], [1, 2, 0.85], [0, 1, 1.1], [2, 1, 1.1], [1, 1, 0.9],
    [0.5, 0.5, 1.15], [1.5, 0.5, 0.8], [0.5, 1.5, 0.95], [1.5, 1.5, 1.05],
  ];
  const circles = dots.map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="${(r * k).toFixed(3)}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><g fill="${ink}" fill-opacity="0.2">${circles}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function Car3D({
  colour = "#E10600",
  carbon = "#15151E",
  helmet = "#E6F854",
  width = 200,
  finish = "matte",
  shadow = true,
  texture = true,
  ink = "#15151E",
  paper = "#F7F4F1",
  dotSpacing = 4,
  streaks = [colour, secondTone(colour)],
  streakOffset = 3,
  title,
  style,
}: Car3DProps) {
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;

  const paint = useMemo(() => {
    // Under the matte finish the print darkens the paint, so the accent and helmet start brighter.
    const lift = finish === "matte" ? (texture ? 1 : 0.5) : 0;
    const props = { a: brighten(colour, lift), c: carbon, h: brighten(helmet, lift) };
    const stop = (st: Stop): [string, number] =>
      st[0] === "k"
        ? [st[1], finish === "matte" ? st[2] * MATTE.wash : st[2]]
        : [tint(st[0], st[1], st[2], props[st[0]], finish), 1];
    return PALETTE.map((fill: Fill): Paint =>
      fill[0] === "g" ? { grad: [stop(fill[1]), stop(fill[2])], box: fill[3] } : { solid: stop(fill) },
    );
  }, [colour, carbon, helmet, finish, texture]);

  // Print geometry in user units, from the CSS-pixel spacing at the rendered width.
  const unitsPerPx = 760 / width;
  const pitch = dotSpacing * unitsPerPx;
  const grainFrequency = (0.6 / unitsPerPx).toFixed(4);
  const [ir, ig, ib] = rgb01(ink);
  const [pr, pg, pb] = rgb01(paper);
  const streakShift = streakOffset * unitsPerPx;

  // A streak facet's painted alpha, lifted so the tones print bold.
  const streakOpacity = (k: number) => {
    const p = paint[k];
    return "solid" in p ? Math.min(0.9, Math.max(0.4, p.solid[1] * 2)) : 0.6;
  };

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
        {/* The Texture print, kept inside the car's own alpha: halftone ink dots and ink grain
            multiplied over the paint, then sparse paper specks screened over the dark areas. */}
        <filter id={id("print")} filterUnits="userSpaceOnUse" x="0" y="0" width="760" height="1225" colorInterpolationFilters="sRGB">
          <feImage href={halftoneTile(ink)} x="0" y="0" width={pitch * 2} height={pitch * 2} result="tile" />
          <feTile in="tile" result="dots" />
          <feComposite in="dots" in2="SourceAlpha" operator="in" result="dotsIn" />
          <feBlend in="dotsIn" in2="SourceGraphic" mode="multiply" result="inked" />
          <feTurbulence type="fractalNoise" baseFrequency={grainFrequency} numOctaves="1" seed="7" result="noise" />
          <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 ${ir}  0 0 0 0 ${ig}  0 0 0 0 ${ib}  0.1 0 0 0 0`} result="grainRaw" />
          <feComposite in="grainRaw" in2="SourceAlpha" operator="in" result="grain" />
          <feBlend in="grain" in2="inked" mode="multiply" result="grained" />
          <feColorMatrix in="noise" type="matrix" values={`0 0 0 0 ${pr}  0 0 0 0 ${pg}  0 0 0 0 ${pb}  0 1 0 0 0`} result="specksRaw" />
          <feComponentTransfer in="specksRaw" result="specksHard">
            <feFuncA type="discrete" tableValues={`${"0 ".repeat(39)}0.25`} />
          </feComponentTransfer>
          <feComposite in="specksHard" in2="SourceAlpha" operator="in" result="specks" />
          <feBlend in="specks" in2="grained" mode="screen" />
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

      <g filter={texture ? url("print") : undefined}>
        {FACETS.map(([k, d], i) => {
          if (streaks && STREAKS.has(i)) return null;
          const p = paint[k];
          return "grad" in p ? (
            <path key={i} d={d} fill={url(`g${k}`)} />
          ) : (
            <path key={i} d={d} fill={p.solid[0]} fillOpacity={p.solid[1] < 1 ? p.solid[1] : undefined} />
          );
        })}
        {/* Duotone motion streaks: the same strokes twice, pulled apart sideways in two tones that
            multiply to the painted dark core where they overlap and fringe in colour where they don't. */}
        {streaks
          ? streaks.map((tone, side) => (
              <g key={side} transform={`translate(${side ? streakShift : -streakShift} 0)`} style={{ mixBlendMode: "multiply" }}>
                {FACETS.map(([k, d], i) =>
                  STREAKS.has(i) ? <path key={i} d={d} fill={tone} fillOpacity={streakOpacity(k)} /> : null,
                )}
              </g>
            ))
          : null}
      </g>
    </svg>
  );
}

const liveries = [
  { name: "F1 red", colour: "#E10600", carbon: "#15151E", helmet: "#E6F854" },
  { name: "McLaren", colour: "#FF8000", carbon: "#1B1F2A", helmet: "#D4F20C" },
  { name: "Ferrari", colour: "#E8002D", carbon: "#1A0E10", helmet: "#F7F4F1" },
  { name: "Mercedes", colour: "#27F4D2", carbon: "#101418", helmet: "#C8CCD4" },
  { name: "Red Bull", colour: "#FFC906", carbon: "#1A2238", helmet: "#E10600" },
  { name: "Aston Martin", colour: "#CEDC00", carbon: "#0B3B32", helmet: "#F7F4F1" },
];

export function Car3DPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Gloss, matte with the print, and the default</h3>
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <Car3D width={200} colour="#F3872F" carbon="#2C323A" helmet="#E7EC4C" finish="gloss" texture={false} streaks={false} shadow={false} title="Gloss, as painted" />
          <Car3D width={200} colour="#F3872F" carbon="#2C323A" helmet="#E7EC4C" shadow={false} title="Matte, as painted" />
          <Car3D width={200} title="Default F1 red" />
        </div>
      </section>
      <section className="ref-group">
        <h3>Team colours</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
          {liveries.map((l) => (
            <div key={l.name} style={{ display: "grid", justifyItems: "center", gap: 12 }}>
              <Car3D colour={l.colour} carbon={l.carbon} helmet={l.helmet} width={150} title={`${l.name} car`} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>On carbon, and small</h3>
        <div style={{ background: "#15151E", borderRadius: 8, padding: 32, display: "flex", gap: 48, alignItems: "flex-end", justifyContent: "center" }}>
          <Car3D width={180} />
          <Car3D width={180} colour="#FF8000" carbon="#1B1F2A" helmet="#D4F20C" />
          <Car3D width={80} colour="#27F4D2" carbon="#101418" />
          <Car3D width={40} />
        </div>
      </section>
      <p className="ref-note">
        <code>{'<Car3D colour="#FF8000" carbon="#1B1F2A" width={200} />'}</code> Nose points down; rotate with CSS for other
        headings. Props: <code>colour</code>, <code>carbon</code>, <code>helmet</code>, <code>width</code>, <code>finish</code>{" "}
        (matte or gloss), <code>texture</code>, <code>ink</code>, <code>paper</code>, <code>dotSpacing</code>, <code>streaks</code>{" "}
        (two tones, or false), <code>streakOffset</code>, <code>shadow</code>, <code>title</code>. Geometry is a set of painted
        facets, tinted; the print is the same halftone as Texture; the motion streaks are a two-tone misprint.
      </p>
    </div>
  );
}
