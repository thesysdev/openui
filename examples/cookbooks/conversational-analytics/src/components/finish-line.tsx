"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Texture } from "./texture";

/*
 * FinishLine: a static SVG checkered floor laid back with a CSS perspective transform.
 * The bottom of the floor is a solid checkerboard. Towards the far edge the rows thin out:
 * first every other tile gives way to the background, then those alternate tiles drop out
 * one by one, and above that is open space, so it blends into whatever page it sits on.
 * The Texture print can sit on top, masked to the tiles so the open area stays clean; it is off
 * by default so the floor stays a clean, light surface under whatever is placed on it.
 */

export type FinishLineProps = {
  /** First tile colour. */
  colorA?: string;
  /** Second tile colour. */
  colorB?: string;
  /** Colour of the open area; transparent by default so it blends into the page. */
  background?: string;
  /** Number of tile columns across. Rows follow from the box's aspect ratio. */
  columns?: number;
  /** 0 to 1: where the solid checkerboard starts, from the top of the floor. */
  band?: number;
  /** Rows above the solid band that fade out into the background. */
  fadeRows?: number;
  /** Floor tilt in degrees; 0 draws it flat. */
  perspective?: number;
  /** Show the Texture print on the tiles (off by default). */
  texture?: boolean;
  /** Texture ink colour (darkens light tiles). */
  ink?: string;
  /** Texture speck colour (lifts dark tiles). */
  paper?: string;
  height?: number | string;
  style?: CSSProperties;
  /** Content laid on the floor with the same perspective, such as a car. Position it in floor
   * coordinates: the solid band starts at `band` (e.g. 45%) from the top. */
  onFloor?: ReactNode;
  /** Content layered flat above everything, such as a headline. */
  children?: ReactNode;
};

type Cell = { x: number; y: number; a: boolean };

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function layoutCells(columns: number, rows: number, band: number, fadeRows: number): Cell[] {
  const solidStart = Math.round(rows * band);
  const cells: Cell[] = [];
  for (let y = Math.max(0, solidStart - fadeRows); y < rows; y++) {
    const f = solidStart - 1 - y; // 0 = fade row next to the band, counting upwards
    for (let x = 0; x < columns; x++) {
      if (f >= 0) {
        // Keep every other tile, then thin those out the further the row is from the band.
        if ((x + f) % 2 !== 0) continue;
        if (f > 0 && hash(x, y) > 1 - f / fadeRows) continue;
      }
      cells.push({ x, y, a: (x + y) % 2 === 0 });
    }
  }
  return cells;
}

export function FinishLine({
  colorA = "#F7F4F1",
  colorB = "#CDCDCD",
  background = "transparent",
  columns = 24,
  band = 0.45,
  fadeRows = 4,
  perspective = 52,
  texture = false,
  ink = "#15151E",
  paper = "#F7F4F1",
  height = 560,
  style,
  onFloor,
  children,
}: FinishLineProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(0.6);

  useEffect(() => {
    const box = boxRef.current!;
    const observer = new ResizeObserver(() => {
      if (box.clientWidth) setAspect(box.clientHeight / box.clientWidth);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const rows = Math.max(fadeRows + 2, Math.round(columns * aspect));
  const cells = layoutCells(columns, rows, band, fadeRows);
  const rects = (fill: (c: Cell) => string) =>
    cells.map((c) => `<rect x="${c.x}" y="${c.y}" width="1.01" height="1.01" fill="${fill(c)}"/>`).join("");
  const svg = (fill: (c: Cell) => string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${rows}" preserveAspectRatio="none">${rects(fill)}</svg>`;

  const floorSvg = svg((c) => (c.a ? colorA : colorB));
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg(() => "#000"))}")`;

  // SVG, texture and onFloor content share one transform so they all lie on the same floor.
  // The scale makes the tilted plane overfill the box, so its edges never show.
  const floorLayer: CSSProperties = {
    position: "absolute",
    inset: 0,
    transformOrigin: "50% 50%",
    transform: perspective ? `perspective(900px) rotateX(${perspective}deg) scale(1.6)` : undefined,
  };

  return (
    <div ref={boxRef} style={{ position: "relative", overflow: "hidden", height, background, ...style }}>
      <div style={floorLayer}>
        <div aria-hidden style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: floorSvg.replace("<svg ", '<svg width="100%" height="100%" ') }} />
        {texture && (
          <Texture
            ink={ink}
            paper={paper}
            layerStyle={{ maskImage: mask, WebkitMaskImage: mask, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }}
          />
        )}
        {onFloor}
      </div>
      {children}
    </div>
  );
}
