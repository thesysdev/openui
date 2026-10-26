// Layout for a two-column flow (customers by segment then and now): nodes
// stacked in rank order on one shared scale, and a ribbon per link that
// leaves its source and enters its target in rank order, so ribbons never
// cross inside a node.

export interface FlowLink {
  from: string;
  to: string;
  value: number;
}

export interface FlowNode {
  name: string;
  side: "left" | "right";
  value: number;
  y0: number;
  y1: number;
}

export interface FlowRibbon extends FlowLink {
  /** Top and bottom of the ribbon where it leaves its source and enters its target. */
  source: [number, number];
  target: [number, number];
  d: string;
}

export interface FlowLayoutOptions {
  /** Node names in rank order, best first; unknown names go last. */
  order: string[];
  top: number;
  bottom: number;
  /** Gap between nodes on a side, in px. */
  gap: number;
  /** Right edge of the left nodes and left edge of the right nodes. */
  x0: number;
  x1: number;
}

export function flowLayout(links: FlowLink[], options: FlowLayoutOptions) {
  const { order, top, bottom, gap, x0, x1 } = options;
  const rank = (name: string) => {
    const i = order.indexOf(name);
    return i < 0 ? order.length : i;
  };
  const sideNodes = (key: "from" | "to") => {
    const totals = new Map<string, number>();
    for (const link of links) totals.set(link[key], (totals.get(link[key]) ?? 0) + link.value);
    return [...totals.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  };
  const left = sideNodes("from");
  const right = sideNodes("to");
  const total = links.reduce((t, l) => t + l.value, 0) || 1;
  const k = (bottom - top - gap * (Math.max(left.length, right.length) - 1)) / total;

  const place = (entries: [string, number][], side: FlowNode["side"]) => {
    let y = top;
    return entries.map(([name, value]) => {
      const node = { name, side, value, y0: y, y1: y + value * k };
      y = node.y1 + gap;
      return node;
    });
  };
  const nodes = [...place(left, "left"), ...place(right, "right")];
  const find = (name: string, side: FlowNode["side"]) =>
    nodes.find((n) => n.name === name && n.side === side)!;

  // Each node fills from the top with its links, in the rank order of the far end.
  const out = new Map<string, number>();
  const into = new Map<string, number>();
  const bySource = [...links].sort(
    (a, b) => rank(a.from) - rank(b.from) || rank(a.to) - rank(b.to),
  );
  const ribbons: FlowRibbon[] = bySource.map((link) => {
    const s = find(link.from, "left");
    const sy = out.get(link.from) ?? s.y0;
    out.set(link.from, sy + link.value * k);
    return { ...link, source: [sy, sy + link.value * k], target: [0, 0], d: "" };
  });
  for (const ribbon of [...ribbons].sort(
    (a, b) => rank(a.to) - rank(b.to) || rank(a.from) - rank(b.from),
  )) {
    const t = find(ribbon.to, "right");
    const ty = into.get(ribbon.to) ?? t.y0;
    into.set(ribbon.to, ty + ribbon.value * k);
    ribbon.target = [ty, ty + ribbon.value * k];
  }
  const mid = (x0 + x1) / 2;
  for (const r of ribbons) {
    const [s0, s1] = r.source;
    const [t0, t1] = r.target;
    r.d = `M${x0},${s0}C${mid},${s0} ${mid},${t0} ${x1},${t0}L${x1},${t1}C${mid},${t1} ${mid},${s1} ${x0},${s1}Z`;
  }
  return { nodes, ribbons };
}
