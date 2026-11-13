"use client";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { CardControlsContext, CardSlotContext } from "../../../shared/cardSlot";
import { useIsomorphicLayoutEffect } from "../../../shared/hooks";
import { widthClass, type Width } from "../../../shared/schema";
import { useViewState, type ViewState } from "../../../shared/viewState";
import { Sheen, StateFrame } from "../../shared/States";

export interface CardProps {
  title: string;
  children: ReactNode;
  width?: Width;
  subtitle?: string;
  controls?: ReactNode;
  hasControls: boolean;
  hasContent: boolean;
  streaming: boolean;
}

export function Card({
  title,
  children,
  width,
  subtitle,
  controls,
  hasControls,
  hasContent,
  streaming,
}: CardProps) {
  const ref = useRef<HTMLElement>(null);
  const writing = useBeingWritten(ref, streaming);
  // While the model streams, the card it is writing (and any whose content
  // hasn't arrived) loads. Once it's done, a card left with no content had
  // every component dropped as invalid: say so instead of drawing a blank card.
  const auto: ViewState | null = streaming
    ? writing || !hasContent
      ? "loading"
      : null
    : !hasContent
      ? "invalid"
      : null;
  const override = useViewState();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <section
      ref={ref}
      className={`openui-dashboard-card ${widthClass(width, "half")}`}
      aria-label={title}
    >
      {/* Loading, however it's triggered: one shimmer across the whole card, over the still skeleton. */}
      {(override ?? auto) === "loading" ? <Sheen /> : null}
      <header className="openui-dashboard-card-head">
        <div>
          <h3 className="openui-dashboard-card-title">{title}</h3>
          {subtitle ? <p className="openui-dashboard-card-subtitle">{subtitle}</p> : null}
        </div>
        {/* The program's own controls, then the slot a chart fills with its view switch. Hidden while empty. */}
        <div className="openui-dashboard-card-controls" role="toolbar" aria-label={`${title} view`}>
          {hasControls ? (
            <CardControlsContext.Provider value={true}>{controls}</CardControlsContext.Provider>
          ) : null}
          <div ref={setSlot} className="openui-dashboard-card-slot" />
        </div>
      </header>
      <div className="openui-dashboard-card-body">
        <CardSlotContext.Provider value={slot}>
          <StateFrame auto={auto}>{children}</StateFrame>
        </CardSlotContext.Provider>
      </div>
    </section>
  );
}

/**
 * Whether this card is the one the model is writing: while streaming, the last
 * card (or tile) on the dashboard. Earlier cards stop re-rendering once their
 * text is complete, so the card watches for a later one to appear.
 */
function useBeingWritten(ref: RefObject<HTMLElement | null>, streaming: boolean) {
  const [last, setLast] = useState(true);
  useIsomorphicLayoutEffect(() => {
    const card = ref.current;
    if (!streaming || !card) return;
    const root = card.closest(".openui-dashboard-dashboard") ?? card.parentElement;
    if (!root) return;
    const check = () => {
      const cards = root.querySelectorAll(".openui-dashboard-card");
      setLast(cards[cards.length - 1] === card);
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ref, streaming]);
  return streaming && last;
}
