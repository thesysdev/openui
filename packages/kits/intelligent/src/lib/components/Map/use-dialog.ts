import { useEffect, type RefObject } from "react";

/** While `open`: lock page scroll, trap Tab focus inside `container`, close on Escape, then restore focus. */
export function useDialog(container: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { close(); return; }
      if (event.key !== "Tab" || !container.current) return;
      const elements = Array.from(container.current.querySelectorAll<HTMLElement>('button,select,a[href],[tabindex="0"]')).filter((item) => item.offsetParent !== null);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === container.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", keydown); previous?.focus(); };
    // `close` only flips state; re-running on its identity would steal focus.
  }, [open]);
}
