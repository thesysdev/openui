"use client";

import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import { Database, Layers, Sigma } from "lucide-react";
import { useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../components/ThemeProvider";
import {
  originOf,
  resolve,
  resultSummary,
  unwrapResult,
  type Describe,
} from "../DataSourcesPanel/describe";
import { ProvenanceContext, useArtifactProvenance, type Previewed } from "./contexts";
import { hoverCardNames, hoverCardStyles } from "./sourcesHoverCard.styles";

/** The rest before the first card. */
const DELAY_MS = 300;
/** After a card closes, the next one within this long shows at once. */
const WARM_MS = 400;
/** Queries a card lists before "+N more". */
const LISTED = 3;

const getNothing = () => null;
const noSubscribe = () => () => {};

/** A pointer that hovers: no card on touch, where it would stick after a tap. */
const canHover = () =>
  typeof window.matchMedia !== "function" || window.matchMedia("(hover: hover)").matches;

/** Focus from the keyboard, not a click or focus given back by the dialog after one. */
function focusVisible(element: Element) {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/** Adds or removes one id in an element's `aria-describedby`, keeping the element's own. */
function describedBy(element: Element, id: string, on: boolean) {
  const ids = (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
  const next = on ? [...new Set([...ids, id])] : ids.filter((each) => each !== id);
  if (next.length) element.setAttribute("aria-describedby", next.join(" "));
  else element.removeAttribute("aria-describedby");
}

/**
 * While inspecting, a small card on the item under the pointer or focus: where its data comes
 * from, before a click opens the dialog. 300ms before the first; the next is instant while one
 * shows or within 400ms of one closing. It leaves at once when the pointer or focus does, when the
 * dialog opens, and when inspect mode ends. It never takes the pointer.
 */
export function SourcesHoverCard({ describeSource }: { describeSource?: Describe }) {
  const provenance = useContext(ProvenanceContext);
  const store = provenance?.previewStore;
  const previewed = useSyncExternalStore(
    store?.subscribe ?? noSubscribe,
    store?.get ?? getNothing,
    getNothing,
  );
  const inspecting = provenance?.isInspecting ?? false;
  const dialogOpen = provenance?.isOpen ?? false;

  const [card, setCard] = useState<{ previewed: Previewed; instant: boolean } | null>(null);
  const showing = useRef(false);
  const closedAt = useRef(-Infinity);
  /** What was previewed when the dialog opened: it gets no card again when the dialog closes. */
  const dismissed = useRef<Previewed | null>(null);

  useEffect(() => {
    if (dialogOpen) dismissed.current = previewed;
    const showable =
      previewed !== null &&
      inspecting &&
      !dialogOpen &&
      previewed !== dismissed.current &&
      (previewed.focus ? focusVisible(previewed.focus) : canHover());
    if (!showable) {
      if (showing.current) closedAt.current = Date.now();
      showing.current = false;
      setCard(null);
      return;
    }
    const show = (instant: boolean) => {
      showing.current = true;
      setCard({ previewed, instant });
    };
    if (showing.current || Date.now() - closedAt.current < WARM_MS) {
      show(true);
      return;
    }
    const timer = setTimeout(() => show(false), DELAY_MS);
    return () => clearTimeout(timer);
  }, [previewed, inspecting, dialogOpen]);

  return card ? (
    <HoverCard previewed={card.previewed} instant={card.instant} describeSource={describeSource} />
  ) : null;
}

function HoverCard({
  previewed,
  instant,
  describeSource,
}: {
  previewed: Previewed;
  instant: boolean;
  describeSource?: Describe;
}) {
  const { sources } = useArtifactProvenance();
  const { portalThemeClassName } = useTheme();
  const id = useId();
  const { target, focus } = previewed;
  // A number above its own element; a table or chart above its root, clear of its rows.
  const anchor = target.propElement ?? target.element;
  const { refs, floatingStyles, placement, isPositioned } = useFloating({
    strategy: "fixed",
    placement: "top",
    elements: { reference: anchor },
    middleware: [offset(8), flip({ fallbackPlacements: ["bottom"] }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const resolved = sources ? resolve(sources, { id: target.id, prop: target.prop }) : null;

  // The item it describes, for screen readers: the focused element, or the hovered one.
  const shown = resolved !== null;
  useEffect(() => {
    if (!shown) return;
    const described = focus ?? anchor;
    describedBy(described, id, true);
    return () => describedBy(described, id, false);
  }, [shown, focus, anchor, id]);

  if (!sources || !resolved) return null;
  const origins = resolved.queries.map((name) =>
    originOf(name, sources.queries[name]!, describeSource),
  );

  let body;
  if (origins.length > 1) {
    body = (
      <>
        <div className={clsx(hoverCardStyles.kind, hoverCardNames.kind)}>
          <Layers aria-hidden />
          <span>{origins.length} queries</span>
          <span className={clsx(hoverCardStyles.name, hoverCardNames.name)}>{target.id}</span>
        </div>
        <ul className={clsx(hoverCardStyles.queries, hoverCardNames.queries)}>
          {origins.slice(0, LISTED).map((origin) => (
            <li key={origin.name}>
              {origin.name}
              <span>{origin.kind}</span>
            </li>
          ))}
        </ul>
        {origins.length > LISTED && (
          <div className={clsx(hoverCardStyles.more, hoverCardNames.more)}>
            +{origins.length - LISTED} more
          </div>
        )}
      </>
    );
  } else if (origins.length === 1) {
    const origin = origins[0]!;
    const value = unwrapResult(origin.query.data);
    const summary = value === undefined ? undefined : resultSummary(value);
    body = (
      <>
        <div className={clsx(hoverCardStyles.kind, hoverCardNames.kind)}>
          {origin.icon ?? <Database aria-hidden />}
          <span>
            {origin.kind === origin.codeLabel
              ? origin.kind
              : `${origin.kind} · ${origin.codeLabel}`}
          </span>
          <span className={clsx(hoverCardStyles.name, hoverCardNames.name)}>{origin.name}</span>
        </div>
        <div className={clsx(hoverCardStyles.code, hoverCardNames.code)}>
          {firstLine(origin.code)}
        </div>
        {(summary || origin.query.loading) && (
          <div className={clsx(hoverCardStyles.result, hoverCardNames.result)}>
            {summary ?? "Loading…"}
          </div>
        )}
      </>
    );
  } else {
    // Nothing read: how it's computed, or that it's written in the program.
    body = (
      <>
        <div className={clsx(hoverCardStyles.kind, hoverCardNames.kind)}>
          <Sigma aria-hidden />
          <span>Formula</span>
          <span className={clsx(hoverCardStyles.name, hoverCardNames.name)}>{target.id}</span>
        </div>
        <div className={clsx(hoverCardStyles.code, hoverCardNames.code)}>
          {resolved.formula.length
            ? firstLine(resolved.formula[0]!)
            : "Written in the program, not read from data."}
        </div>
      </>
    );
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      id={id}
      role="tooltip"
      className={clsx(hoverCardStyles.root, hoverCardNames.root, portalThemeClassName)}
      style={floatingStyles}
      data-side={placement.startsWith("bottom") ? "bottom" : "top"}
      data-placed={isPositioned || undefined}
      data-instant={instant || undefined}
    >
      {body}
      <div className={clsx(hoverCardStyles.hint, hoverCardNames.hint)}>Click for details</div>
    </div>,
    document.body,
  );
}

const firstLine = (text: string) => {
  const line = text.split("\n").find((each) => each.trim()) ?? "";
  return line.trim();
};
