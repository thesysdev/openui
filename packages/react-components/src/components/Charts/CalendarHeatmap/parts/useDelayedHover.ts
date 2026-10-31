import { useEffect, useRef, useState } from "react";

/**
 * Show/hide-delayed passthrough for a hover payload, ported from bklit's
 * `useDelayedTooltipData`. Returns `active` verbatim once shown, but debounces
 * the transitions: the first appearance waits `show` ms, and after the pointer
 * leaves (`active` → `null`) the last payload lingers for `hide` ms so a quick
 * hop between adjacent cells doesn't flicker the tooltip.
 *
 * While already visible, position/value changes pass through immediately (only
 * the show and hide edges are delayed). Not a pure module — timers + effect
 * cleanup — so it carries no vitest (the bench smoke test drives the DOM).
 */
export function useDelayedHover<T>(
  active: T | null,
  delay?: { show?: number; hide?: number },
): T | null {
  const show = delay?.show ?? 0;
  const hide = delay?.hide ?? 120;

  const [display, setDisplay] = useState<T | null>(null);
  const isShowingRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = undefined;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = undefined;
    }

    if (active) {
      // Already visible, or no show delay: update in place immediately.
      if (isShowingRef.current || show === 0) {
        isShowingRef.current = true;
        setDisplay(active);
        return;
      }
      showTimerRef.current = setTimeout(() => {
        isShowingRef.current = true;
        setDisplay(active);
      }, show);
      return;
    }

    if (hide === 0) {
      isShowingRef.current = false;
      setDisplay(null);
      return;
    }
    hideTimerRef.current = setTimeout(() => {
      isShowingRef.current = false;
      setDisplay(null);
    }, hide);
  }, [active, show, hide]);

  useEffect(
    () => () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  return display;
}
