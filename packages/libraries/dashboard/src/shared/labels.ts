/* ---------- Point labels that don't collide ---------- */

let measureCtx: CanvasRenderingContext2D | null | undefined;
/** A label's width in px at the kit's font: measured on a canvas, estimated where there is none. */
export function textWidth(text: string, fontSize = 11) {
  if (measureCtx === undefined)
    measureCtx =
      typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * fontSize * 0.58;
  measureCtx.font = `${fontSize}px ${getComputedStyle(document.body).fontFamily || "sans-serif"}`;
  return measureCtx.measureText(text).width;
}

export type PointLabel = { key: string | number; x: number; y: number; r: number; text: string };
export type PlacedLabel = PointLabel & { lx: number; ly: number; moved: boolean };

/**
 * Places point labels without overlap: in the order given (most important first), each tries
 * above its dot, then below, then steps further up and down a line at a time. A label that had
 * to move gets a leader line back to its dot. Labels that find no room are left out.
 */
export function placeLabels(
  points: PointLabel[],
  fontSize = 11,
  bounds?: { x: number; y: number; width: number; height: number },
): PlacedLabel[] {
  const h = fontSize + 3;
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const out: PlacedLabel[] = [];
  const hits = (b: { x0: number; x1: number; y0: number; y1: number }) =>
    placed.some((p) => b.x0 < p.x1 + 2 && p.x0 < b.x1 + 2 && b.y0 < p.y1 && p.y0 < b.y1);
  for (const point of points) {
    const w = textWidth(point.text, fontSize);
    const above = point.y - point.r - 6; // baseline just over the dot
    const below = point.y + point.r + h;
    const tries = [above, below, above - h, below + h, above - 2 * h, below + 2 * h];
    for (const [n, ly] of tries.entries()) {
      let lx = point.x;
      if (bounds) lx = Math.min(Math.max(lx, bounds.x + w / 2), bounds.x + bounds.width - w / 2);
      const box = { x0: lx - w / 2, x1: lx + w / 2, y0: ly - fontSize, y1: ly + 3 };
      if (bounds && (box.y0 < bounds.y - 4 || box.y1 > bounds.y + bounds.height + 4)) continue;
      if (hits(box)) continue;
      placed.push(box);
      out.push({ ...point, lx, ly, moved: n > 1 });
      break;
    }
  }
  return out;
}
