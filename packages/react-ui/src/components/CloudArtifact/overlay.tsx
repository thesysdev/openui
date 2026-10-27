"use client";

import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeProvider";

interface OverlayProps {
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/** A fullscreen dialog on `document.body`. Escape and a click outside close it. */
function Overlay({ label, onClose, children }: OverlayProps) {
  const { portalThemeClassName } = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className={clsx("openui-artifact-overlay", portalThemeClassName)}
      onClick={() => onCloseRef.current()}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="openui-artifact-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

interface OpenSurfaceProps extends OverlayProps {
  /**
   * `undefined`: open in the overlay. An element: portal into it. `null`: the
   * element isn't mounted yet (a ref callback hasn't run), so render nothing.
   */
  target: HTMLElement | null | undefined;
}

/** Where the open artifact goes: your element, or the overlay. */
export function OpenSurface({ target, label, onClose, children }: OpenSurfaceProps) {
  if (typeof document === "undefined") return null;
  if (target === null) return null;
  if (target) return createPortal(children, target);
  return createPortal(
    <Overlay label={label} onClose={onClose}>
      {children}
    </Overlay>,
    document.body,
  );
}
