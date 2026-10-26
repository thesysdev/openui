import { useEffect } from "react";

/**
 * Keeps generated dashboards free of half-empty cards.
 *
 * A base CardRow stretches its cards to the tallest one. The gallery pairs
 * cards of similar height, but a model writing a dashboard cannot know heights,
 * and often puts a short card (a funnel, a few bars) beside a long table. A
 * filling chart takes up some of the slack, to its maximum height. When a card
 * would still be left with a large blank below its content, the row stacks:
 * every card takes the full width, so none is stretched over empty space.
 *
 * One balancer watches the page's kit roots (each outermost `.kit-theme`) and
 * nothing else, so a host app's own DOM changes never reach it. A kit component
 * mounting registers the roots; a root is let go once it leaves the document,
 * and the balancer stops when none is left. A stacked row stays stacked until
 * the window width changes, so the layout never flips back and forth as heights
 * settle.
 */

const ROOT = ".kit-theme";
const ROW = ".kit-theme .c1-card-row";
const STACKED = "kit-row--stacked";
/** Blank height a card may keep below its content before its row stacks. */
const MAX_BLANK = 140;
/** …and the share of the row height that blank may be. */
const MAX_BLANK_SHARE = 0.25;

interface Balancer {
  watch(root: Element): void;
  /** Lets go of roots no longer in the document; stops when none is left. */
  prune(): void;
  roots(): Element[];
}

let balancer: Balancer | null = null;

/**
 * Watches the page's kit roots while a kit component is mounted. Components
 * show Pending only until their data arrives, so a root stays watched after
 * they unmount, for as long as it is in the document: that is when its rows
 * fill in and need balancing.
 */
export function useRowBalance() {
  useEffect(() => {
    watchKitRoots();
    // Unmounting with its dashboard: the DOM is gone by now, so let it go.
    return releaseDetachedRoots;
  }, []);
}

/** Registers every outermost `.kit-theme` in the document with the balancer. */
export function watchKitRoots() {
  if (
    typeof window === "undefined" ||
    typeof ResizeObserver === "undefined" ||
    typeof MutationObserver === "undefined"
  ) {
    return;
  }
  for (const root of document.querySelectorAll(ROOT)) {
    // A nested root is already inside an outer one's subtree.
    if (root.parentElement?.closest(ROOT)) continue;
    (balancer ??= createBalancer()).watch(root);
  }
  balancer?.prune();
}

/** Lets go of kit roots that have left the document. */
export function releaseDetachedRoots() {
  balancer?.prune();
}

/** The roots the balancer is watching (for tests). */
export function watchedKitRoots(): Element[] {
  return balancer?.roots() ?? [];
}

function createBalancer(): Balancer {
  const roots = new Map<Element, MutationObserver>();
  const observed = new WeakSet<Element>();
  const dirty = new Set<Element>();
  let frame = 0;
  let scanQueued = false;

  const flush = () => {
    frame = 0;
    prune();
    if (!roots.size) return;
    if (scanQueued) {
      scanQueued = false;
      for (const root of roots.keys()) scan(root);
    }
    for (const row of dirty) if (row.isConnected) balance(row);
    dirty.clear();
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(flush);
  };
  // Also sees a root leave the document: its size drops to zero.
  const resize = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const row = entry.target.closest(ROW);
      if (row) dirty.add(row);
    }
    schedule();
  });

  // Watch each card and each block of its body: a short card keeps the row's
  // height when its content grows, so only its blocks report the change.
  function scan(root: Element) {
    for (const row of root.querySelectorAll(ROW)) {
      for (const card of cardsOf(row)) {
        for (const el of [card, ...bodyOf(card).children]) {
          if (observed.has(el)) continue;
          observed.add(el);
          resize.observe(el);
          dirty.add(row);
        }
      }
    }
  }

  let width = window.innerWidth;
  const onWindowResize = () => {
    if (window.innerWidth === width) return;
    width = window.innerWidth;
    for (const root of roots.keys()) {
      for (const row of root.querySelectorAll(`${ROW}.${STACKED}`)) {
        row.classList.remove(STACKED);
        dirty.add(row);
      }
    }
    schedule();
  };
  window.addEventListener("resize", onWindowResize);

  function prune() {
    for (const [root, mutations] of roots) {
      if (root.isConnected) continue;
      mutations.disconnect();
      resize.unobserve(root);
      roots.delete(root);
    }
    if (roots.size || balancer !== self) return;
    resize.disconnect();
    window.removeEventListener("resize", onWindowResize);
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    dirty.clear();
    balancer = null;
  }

  const self: Balancer = {
    watch(root) {
      if (roots.has(root)) return;
      const mutations = new MutationObserver(() => {
        scanQueued = true;
        schedule();
      });
      mutations.observe(root, { childList: true, subtree: true });
      roots.set(root, mutations);
      resize.observe(root);
      scan(root);
      schedule();
    },
    prune,
    roots: () => [...roots.keys()],
  };
  return self;
}

function cardsOf(row: Element): HTMLElement[] {
  return [...row.children].filter(
    (c): c is HTMLElement =>
      c instanceof HTMLElement &&
      c.classList.contains("c1-shell-card") &&
      !c.classList.contains("c1-shell-card--small"),
  );
}

function bodyOf(card: Element): Element {
  return card.querySelector(":scope > .c1-shell-card__content-wrap") ?? card;
}

/** Stacks the row when a card in it would sit over a large blank. */
function balance(row: Element) {
  if (row.classList.contains(STACKED)) return;
  const cards = cardsOf(row);
  if (cards.length < 2) return;
  // Only cards side by side: a row that already wraps has nothing to balance.
  const tops = cards.map((c) => c.getBoundingClientRect().top);
  if (Math.max(...tops) - Math.min(...tops) > 2) return;

  const measured = cards.map(measure);
  const tallest = Math.max(...measured.map((m) => m.natural));
  if (tallest <= 0) return;
  const blank = (m: Measure) => tallest - m.natural - m.room;
  if (measured.some((m) => blank(m) > Math.max(MAX_BLANK, tallest * MAX_BLANK_SHARE))) {
    row.classList.add(STACKED);
  }
}

interface Measure {
  /** The card's height with its content at its own size, nothing stretched. */
  natural: number;
  /** How much its filling charts can still grow. */
  room: number;
}

function measure(card: HTMLElement): Measure {
  const box = card.getBoundingClientRect();
  let bottom = box.top;
  // The lowest content, looking inside blocks stretched to the card's bottom.
  const walk = (el: Element, depth: number) => {
    for (const child of el.children) {
      const b = child.getBoundingClientRect();
      if (b.height === 0) continue;
      if (depth < 5 && b.bottom > box.bottom - 24 && child.children.length > 0)
        walk(child, depth + 1);
      else bottom = Math.max(bottom, b.bottom);
    }
  };
  walk(bodyOf(card), 0);

  let grown = 0;
  let room = 0;
  for (const frame of card.querySelectorAll<HTMLElement>(
    "[data-kit-fill] [class*='-frame--fill']",
  )) {
    const min = parseFloat(frame.style.minHeight) || 0;
    const max = parseFloat(frame.style.maxHeight) || Infinity;
    grown += Math.max(0, frame.offsetHeight - min);
    room += Math.max(0, max - min);
  }
  const padding = parseFloat(getComputedStyle(card).paddingBottom) || 0;
  return { natural: bottom - box.top + padding - grown, room };
}
