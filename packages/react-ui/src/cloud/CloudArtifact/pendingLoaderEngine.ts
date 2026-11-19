import { pendingLoaderNames as names } from "./pendingLoader.styles";

/*
 * The pending loader: skeleton dashboard cards that split, merge and slide on
 * a grid while the artifact is on its way. The layout is a tree of cuts, so
 * the cards always tile the drawing edge to edge, with no gaps or overlaps.
 * The drawing has its own size and scales to fit the stage, like an SVG.
 */

/** Milliseconds between layout changes, give or take a quarter. */
const TEMPO = 1700;
const FADE = 460;
const LEAVE = 280;
export const EASE_OUT = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

interface Grid {
  cols: number;
  rows: number;
  /** A card's smallest size, in grid units. */
  minW: number;
  minH: number;
  gap: number;
  /** How many cards the drawing keeps. */
  count: [number, number];
}

/** Portrait, square-ish and landscape: the one nearest the stage's shape is used. */
const GRIDS: Grid[] = [
  { cols: 4, rows: 8, minW: 2, minH: 2, gap: 10, count: [3, 5] },
  { cols: 8, rows: 6, minW: 2, minH: 2, gap: 12, count: [4, 7] },
  { cols: 12, rows: 6, minW: 3, minH: 2, gap: 14, count: [5, 8] },
];

/** A grid cell in the drawing, before it's scaled to fit. */
const CELL_W = 80;
const CELL_H = 90;
/** How far past its own size the drawing grows on a big stage. */
const MAX_SCALE = 1.5;

/** The drawing's own size for a grid, in pixels before scaling. */
const sizeOf = ({ cols, rows, gap }: Grid) => ({
  w: cols * CELL_W + (cols - 1) * gap,
  h: rows * CELL_H + (rows - 1) * gap,
});

/** How far a grid's shape is from the stage's: 0 when they match, the same for twice as wide or tall. */
const misfit = (g: Grid, aspect: number) => {
  const { w, h } = sizeOf(g);
  return Math.abs(Math.log(aspect / (w / h)));
};

/** The host's own grid, with smallest card sizes and a card count worked out from its size. */
function customGrid(columns: number, rowCount: number): Grid {
  const size = (v: number) => clamp(Math.round(v) || 2, 2, 24);
  const cols = size(columns);
  const rows = size(rowCount);
  const minW = cols >= 12 ? 3 : 2;
  const minH = rows < 4 ? 1 : 2;
  const fits = Math.floor(cols / minW) * Math.floor(rows / minH);
  const most = clamp(Math.round(fits * 0.6), 2, 8);
  return { cols, rows, minW, minH, gap: 12, count: [Math.max(2, most - 2), most] };
}

type Kind = "kpi" | "area" | "line" | "bars" | "hbars" | "donut" | "rows";
/** One card. */
interface Leaf {
  id: number;
  kind?: Kind;
}
/** A cut: `col` puts `a` and `b` side by side, `row` stacks them. */
interface Cut {
  dir: "col" | "row";
  ratio: number;
  a: Node;
  b: Node;
}
type Node = Leaf | Cut;
/** A rectangle in grid units. */
interface Rect {
  c: number;
  r: number;
  w: number;
  h: number;
}
/** A rectangle in pixels. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Split {
  n: Cut;
  size: number;
  lo: number;
  hi: number;
  at: number;
}
interface Layout {
  leaves: { n: Leaf; r: Rect }[];
  splits: Split[];
}
type Move = "split" | "merge" | "shift" | "swap" | "rotate" | "refresh";

const isCut = (n: Node): n is Cut => "dir" in n;

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const ri = (a: number, b: number) => Math.floor(rnd(a, b + 1));
const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]!;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
function weighted<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map(weight);
  let x = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) if ((x -= weights[i]!) <= 0) return items[i]!;
  return items[items.length - 1]!;
}

// ── Card contents: a title bar and one shape, just enough to hint at what's coming ──

const bone = (cls = "", width?: number) =>
  `<i class="${names.bone} ${cls}"${width ? ` style="--bw:${Math.round(width)}%"` : ""}></i>`;
const times = (k: number, fn: () => string) => Array.from({ length: k }, fn).join("");
const title = () => bone(names.title, rnd(30, 50));

/** A smooth random series in a 100×100 box, as a line and as the area under it. */
function series(k: number, top: number, bottom: number) {
  const f = (v: number) => v.toFixed(1);
  const step = (bottom - top) / 3;
  const pts: [number, number][] = [];
  let y = rnd(top, bottom);
  for (let i = 0; i < k; i++) {
    y = clamp(y + rnd(-step, step), top, bottom);
    pts.push([(i * 100) / (k - 1), y]);
  }
  let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`;
  for (let i = 0; i < k - 1; i++) {
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p0 = pts[i - 1] ?? p1;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6] as const;
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6] as const;
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return { line: d, area: `${d} L100,100 L0,100 Z` };
}

const svg = (cls: string, path: string) =>
  `<svg class="${cls}" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${path}"/></svg>`;

const KINDS: Record<Kind, () => string> = {
  kpi: () => `${title()}<div class="${names.fill}"></div>${bone(names.number, rnd(45, 65))}`,
  area: () => `${title()}${svg(names.area, series(8, 20, 75).area)}`,
  line: () => `${title()}${svg(`${names.area} ${names.trend}`, series(8, 15, 85).line)}`,
  bars: () =>
    `${title()}<div class="${names.bars}">${times(7, () => `<i style="--v:${rnd(0.3, 0.95).toFixed(2)}"></i>`)}</div>`,
  hbars: () => {
    const values = Array.from({ length: 5 }, () => rnd(0.3, 1)).sort((a, b) => b - a);
    return `${title()}<div class="${names.hbars}">${values.map((v) => `<i style="--v:${v.toFixed(2)}"></i>`).join("")}</div>`;
  },
  donut: () =>
    `${title()}<div class="${names.ring}"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36"/></svg></div>`,
  rows: () =>
    `${title()}<div class="${names.rows} ${names.fade}">${times(5, () => bone("", rnd(60, 95)))}</div>`,
};
const GRAPHS: Kind[] = ["line", "area", "bars", "hbars", "donut"];
const isGraph = (kind: Kind | undefined) => kind !== undefined && GRAPHS.includes(kind);

/**
 * Fills `stage`, a positioned element, with moving cards. With a `fixed` grid it always uses
 * that one; otherwise the built-in grid nearest the stage's shape. Returns a function that stops it.
 */
export function startPendingLoader(
  stage: HTMLElement,
  fixed?: { cols: number; rows: number },
): () => void {
  if (typeof ResizeObserver === "undefined") return () => {};
  const reduced = prefersReducedMotion();
  const grids = fixed ? [customGrid(fixed.cols, fixed.rows)] : GRIDS;
  const cards = new Map<number, HTMLElement>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  // The drawing: the cards are laid out at its own size, and it's scaled to fit the stage.
  const container = document.createElement("div");
  container.className = names.container;
  stage.append(container);
  let grid = grids[0]!;
  /** The drawing's own size, before scaling. */
  let width = 0;
  let height = 0;
  let tree: Node | null = null;
  let nextId = 1;
  let recent: Kind[] = [];

  const later = (fn: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      fn();
    }, ms);
    timers.add(timer);
  };

  // ── Split tree. Nodes are replaced, never changed, apart from a leaf's kind, picked when it first shows. ──

  const leaf = (): Leaf => ({ id: nextId++ });

  /** The smallest size, in grid units, a subtree takes along an axis without shrinking a card below its minimum. */
  function need(n: Node, axis: "x" | "y"): number {
    if (!isCut(n)) return axis === "x" ? grid.minW : grid.minH;
    const along = (n.dir === "col") === (axis === "x");
    const a = need(n.a, axis);
    const b = need(n.b, axis);
    return along ? a + b : Math.max(a, b);
  }

  function place(n: Node, r: Rect, out: Layout): boolean {
    if (r.w < need(n, "x") || r.h < need(n, "y")) return false;
    if (!isCut(n)) {
      out.leaves.push({ n, r });
      return true;
    }
    const col = n.dir === "col";
    const size = col ? r.w : r.h;
    const axis = col ? "x" : "y";
    const lo = need(n.a, axis);
    const hi = size - need(n.b, axis);
    const at = clamp(Math.round(n.ratio * size), lo, hi);
    out.splits.push({ n, size, lo, hi, at });
    const ra = col ? { ...r, w: at } : { ...r, h: at };
    const rb = col ? { ...r, c: r.c + at, w: r.w - at } : { ...r, r: r.r + at, h: r.h - at };
    return place(n.a, ra, out) && place(n.b, rb, out);
  }

  function layout(t: Node): Layout | null {
    const out: Layout = { leaves: [], splits: [] };
    return place(t, { c: 0, r: 0, w: grid.cols, h: grid.rows }, out) ? out : null;
  }

  function replace(n: Node, target: Node, next: Node): Node {
    if (n === target) return next;
    if (!isCut(n)) return n;
    const a = replace(n.a, target, next);
    const b = replace(n.b, target, next);
    return a === n.a && b === n.b ? n : { ...n, a, b };
  }

  function parentOf(t: Node, n: Node): Cut | null {
    if (!isCut(t)) return null;
    return t.a === n || t.b === n ? t : (parentOf(t.a, n) ?? parentOf(t.b, n));
  }

  // Each move returns a candidate tree; `tick` keeps it only if it still lays out.
  const moves: Record<Move, (t: Node, L: Layout) => Node | null> = {
    split(t, L) {
      const { minW, minH } = grid;
      const options = L.leaves.filter(({ r }) => r.w >= 2 * minW || r.h >= 2 * minH);
      if (!options.length) return null;
      const { n, r } = weighted(options, ({ r }) => r.w * r.h);
      const p = toPx(r);
      const canCol = r.w >= 2 * minW;
      const canRow = r.h >= 2 * minH;
      // Mostly cut across the longer side, so new cards stay well proportioned.
      const dir =
        canCol && canRow
          ? Math.random() < p.w / (p.w + p.h)
            ? "col"
            : "row"
          : canCol
            ? "col"
            : "row";
      const size = dir === "col" ? r.w : r.h;
      const min = dir === "col" ? minW : minH;
      const fresh = leaf();
      const [a, b] = Math.random() < 0.5 ? [n, fresh] : [fresh, n];
      return replace(t, n, { dir, ratio: ri(min, size - min) / size, a, b });
    },
    merge(t, L) {
      if (!isCut(t)) return null;
      const { n } = weighted(L.leaves, ({ r }) => 1 / (r.w * r.h));
      const parent = parentOf(t, n);
      return parent && replace(t, parent, parent.a === n ? parent.b : parent.a);
    },
    shift(t, L) {
      const options = L.splits.filter((s) => s.hi > s.lo);
      if (!options.length) return null;
      const s = pick(options);
      let at = s.at;
      while (at === s.at) at = ri(s.lo, s.hi);
      return replace(t, s.n, { ...s.n, ratio: at / s.size });
    },
    swap(t, L) {
      if (!isCut(t)) return null;
      const s = pick(L.splits).n;
      return replace(t, s, { ...s, a: s.b, b: s.a });
    },
    rotate(t, L) {
      if (!isCut(t)) return null;
      const s = pick(L.splits).n;
      return replace(t, s, { ...s, dir: s.dir === "col" ? "row" : "col" });
    },
    refresh(t, L) {
      return replace(t, pick(L.leaves).n, leaf());
    },
  };

  // Small slots get KPI tiles; bigger ones a widget that suits their shape and wasn't just
  // shown. Until two graphs show, any slot gets a graph, so it never reads as a wall of KPIs.
  function pickKind(r: Rect, p: Box): Kind {
    const graphs = [...cards.values()].filter((el) => isGraph(el.dataset["kind"] as Kind)).length;
    if (r.w * r.h <= 8 && r.h <= 3 && graphs >= 2) return "kpi";
    const aspect = p.w / p.h;
    let pool: Kind[] =
      aspect > 2.1
        ? ["line", "area", "bars", "hbars", "rows"]
        : aspect < 0.85
          ? ["rows", "donut", "hbars"]
          : ["line", "area", "bars", "hbars", "donut", "rows"];
    if (graphs < 2) pool = pool.filter(isGraph);
    const unused = pool.filter((k) => !recent.includes(k));
    const kind = pick(unused.length ? unused : pool);
    recent = [kind, ...recent].slice(0, 3);
    return kind;
  }

  // ── Rendering ──

  function toPx(r: Rect): Box {
    const { cols, rows, gap } = grid;
    const cw = (width - gap * (cols - 1)) / cols;
    const rh = (height - gap * (rows - 1)) / rows;
    return {
      x: r.c * (cw + gap),
      y: r.r * (rh + gap),
      w: r.w * cw + (r.w - 1) * gap,
      h: r.h * rh + (r.h - 1) * gap,
    };
  }

  function setBox(el: HTMLElement, p: Box) {
    el.style.translate = `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`;
    el.style.width = `${p.w.toFixed(2)}px`;
    el.style.height = `${p.h.toFixed(2)}px`;
  }

  function enter(n: Leaf, r: Rect, p: Box, delay: number) {
    const kind = (n.kind ??= pickKind(r, p));
    const el = document.createElement("div");
    el.className = names.card;
    el.dataset["kind"] = kind;
    // Under the cards sliding past until it has faded in.
    el.style.zIndex = "0";
    setBox(el, p);
    el.innerHTML = `<div class="${names.body}">${KINDS[kind]()}</div>`;
    container.append(el);
    cards.set(n.id, el);
    if (!reduced) {
      el.animate?.(
        [
          { opacity: 0, scale: 0.965 },
          { opacity: 1, scale: 1 },
        ],
        {
          duration: FADE,
          delay,
          easing: EASE_OUT,
          fill: "backwards",
        },
      );
    }
    later(() => el.style.removeProperty("z-index"), delay + FADE);
  }

  function leave(id: number) {
    const el = cards.get(id);
    if (!el) return;
    cards.delete(id);
    el.style.zIndex = "0";
    if (reduced) {
      el.remove();
      return;
    }
    el.animate?.(
      [
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 0.97 },
      ],
      {
        duration: LEAVE,
        easing: EASE_OUT,
        fill: "forwards",
      },
    );
    later(() => el.remove(), LEAVE);
  }

  // Leaving cards fade first, the others then slide into the space, and new cards fade in last.
  function render(L: Layout, stagger = false) {
    const live = new Set(L.leaves.map(({ n }) => n.id));
    const leaving = [...cards.keys()].filter((id) => !live.has(id));
    const moveDelay = leaving.length ? 110 : 0;
    const enterDelay = cards.size > leaving.length ? 240 : 0;
    leaving.forEach(leave);
    for (const { n, r } of L.leaves) {
      const p = toPx(r);
      const el = cards.get(n.id);
      if (el) {
        el.style.transitionDelay = `${moveDelay}ms`;
        setBox(el, p);
      } else {
        enter(n, r, p, stagger ? (r.c + r.r) * 45 : enterDelay);
      }
    }
  }

  // ── Loop ──

  function tick() {
    const L = tree && !document.hidden ? layout(tree) : null;
    if (!tree || !L) return;
    const count = L.leaves.length;
    const [lo, hi] = grid.count;
    const odds: Record<Move, number> = {
      split: count < hi ? 3 : 0,
      merge: count > lo ? 3 : 0,
      shift: 3,
      swap: 1.6,
      rotate: 1,
      refresh: 1,
    };
    const options = (Object.keys(odds) as Move[]).filter((k) => odds[k] > 0);
    let move: Move = "shift";
    let next: Node | null = null;
    for (let i = 0; i < 12 && !next; i++) {
      move = count < lo ? "split" : count > hi ? "merge" : weighted(options, (k) => odds[k]);
      const candidate = moves[move](tree, L);
      if (candidate && layout(candidate)) next = candidate;
    }
    if (!next) return;
    // Sometimes pair a move with a divider shift, so two things change at once.
    if (move !== "shift" && Math.random() < 0.28) {
      const extra = moves.shift(next, layout(next)!);
      if (extra && layout(extra)) next = extra;
    }
    tree = next;
    render(layout(tree)!);
    ensureGraphs();
  }

  // Merges can remove graphs, and KPI tiles can grow into big slots. Until two graphs show,
  // swap the biggest other card for a fresh one, which `pickKind` makes a graph.
  function ensureGraphs() {
    for (let i = 0; i < 2 && tree; i++) {
      const L = layout(tree);
      if (!L) return;
      const graphs = L.leaves.filter(({ n }) => isGraph(n.kind)).length;
      const others = L.leaves.filter(({ n }) => n.kind !== undefined && !isGraph(n.kind));
      if (graphs >= Math.min(2, L.leaves.length) || !others.length) return;
      const { n } = others.reduce((a, b) => (b.r.w * b.r.h > a.r.w * a.r.h ? b : a));
      tree = replace(tree, n, leaf());
      render(layout(tree)!);
    }
  }

  function schedule() {
    if (reduced) return;
    later(
      () => {
        tick();
        schedule();
      },
      TEMPO * rnd(0.8, 1.25),
    );
  }

  // Start from a familiar dashboard: a strip of KPI tiles over one big area, which then splits up.
  function seed(): Node {
    const { cols, rows, minW, minH, count } = grid;
    const target = ri(...count);
    const tiles = clamp(target - 2, 2, Math.min(4, Math.floor(cols / minW)));
    const tile = (): Leaf => ({ ...leaf(), kind: "kpi" });
    const strip = (k: number): Node =>
      k === 1 ? tile() : { dir: "col", ratio: 1 / k, a: tile(), b: strip(k - 1) };
    let t: Node = { dir: "row", ratio: minH / rows, a: strip(tiles), b: leaf() };
    for (let i = 0; i < 40; i++) {
      const L = layout(t);
      if (!L || L.leaves.length >= target) break;
      const next = moves.split(t, L);
      if (next && layout(next)) t = next;
    }
    return t;
  }

  function rebuild() {
    [...cards.keys()].forEach(leave);
    tree = seed();
    const L = layout(tree);
    if (L) render(L, true);
    ensureGraphs();
  }

  // A new stage size only rescales the drawing, like an SVG's viewBox: whole, centred, and no
  // bigger than MAX_SCALE. The cards move only when the stage's shape calls for another grid.
  const observer = new ResizeObserver(([entry]) => {
    const { width: w = 0, height: h = 0 } = entry?.contentRect ?? {};
    if (!w || !h) return;
    const fits = grids.reduce((a, b) => (misfit(b, w / h) < misfit(a, w / h) ? b : a));
    if (fits !== grid || !tree) {
      grid = fits;
      ({ w: width, h: height } = sizeOf(grid));
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      rebuild();
    }
    const scale = Math.min(w / width, h / height, MAX_SCALE);
    container.style.setProperty("--openui-pending-scale", scale.toFixed(4));
  });
  observer.observe(stage);
  schedule();

  return () => {
    observer.disconnect();
    timers.forEach(clearTimeout);
    timers.clear();
    // The stage outlives a re-run effect (React's strict mode runs it twice).
    stage.replaceChildren();
  };
}
