"use client";
import {
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useStyleClasses } from "../../../shared/styleClasses";
import { ThemeContext } from "../../ThemeProvider";

/* ---------- Shared popover for richer filters ---------- */

export const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function Popover({
  label,
  active,
  disabled,
  children,
  width = 280,
}: {
  label: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children: (close: () => void) => ReactNode;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const theme = useContext(ThemeContext);
  const portalStyles = useStyleClasses("filters", "shared");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  // Measured before opening so the first paint is already placed: a panel that
  // would run past the dashboard's (or window's) right edge anchors to the
  // trigger's right side instead.
  const toggle = () => {
    if (!open && ref.current) {
      const box = ref.current.getBoundingClientRect();
      const edge = Math.min(
        ref.current.closest(".openui-dashboard-root")?.getBoundingClientRect().right ??
          window.innerWidth,
        window.innerWidth,
      );
      setPosition({
        top: box.bottom + 6,
        left: Math.max(8, box.left + width > edge - 8 ? box.right - width : box.left),
      });
    }
    setOpen((value) => !value);
  };
  useEffect(() => {
    if (!open) return;
    // Focus moves into the dialog on open — onto the selected option when
    // there is one — and returns to the trigger on close.
    (
      panel.current?.querySelector<HTMLElement>(
        '[aria-selected="true"], .openui-dashboard-cal-day[aria-pressed="true"]',
      ) ??
      panel.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel.current
    )?.focus();
    const onDown = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const reposition = () => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      const edge = Math.min(
        ref.current?.closest(".openui-dashboard-root")?.getBoundingClientRect().right ??
          window.innerWidth,
        window.innerWidth,
      );
      setPosition({
        top: box.bottom + 6,
        left: Math.max(8, box.left + width > edge - 8 ? box.right - width : box.left),
      });
    };
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    // Capture phase: hosts often stop keyboard events from bubbling to the document.
    document.addEventListener("mousedown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, width]);
  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  // Tab cycles inside the open dialog instead of walking out into the page.
  const trapTab = (event: ReactKeyboardEvent) => {
    if (event.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };
  return (
    <div className="openui-dashboard-popover-anchor" ref={ref}>
      <button
        ref={trigger}
        type="button"
        className="openui-dashboard-filter-button"
        data-active={active ? "true" : undefined}
        aria-expanded={open}
        aria-controls={id}
        disabled={disabled}
        onClick={toggle}
      >
        {label}
        <span className="openui-dashboard-filter-caret" aria-hidden />
      </button>
      {open && !disabled
        ? createPortal(
            <div className={portalStyles} style={theme?.style}>
              <div
                className="openui-dashboard-popover"
                id={id}
                role="dialog"
                aria-modal="true"
                style={{
                  position: "fixed",
                  width,
                  maxWidth: "calc(100vw - 16px)",
                  ...position,
                  zIndex: 70,
                }}
                ref={panel}
                tabIndex={-1}
                onKeyDown={trapTab}
              >
                {children(close)}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
