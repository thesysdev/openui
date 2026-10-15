"use client";

import clsx from "clsx";
import { Maximize2, X } from "lucide-react";
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider";

export interface ShellProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

// Matches the scale+fade in shell.scss; unmount waits for the close animation.
const CLOSE_MS = 200;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A frame for dashboards: a small header with an expand button, wider than
 * the chat column it sits in. Expand opens the same content full screen.
 */
export const Shell = ({ title, children, className }: ShellProps) => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const expandRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setClosing(true);
    window.setTimeout(
      () => {
        setOpen(false);
        setClosing(false);
        expandRef.current?.focus();
      },
      reduced ? 0 : CLOSE_MS,
    );
  }, []);

  return (
    <section className={clsx("openui-shell", className)}>
      <div className="openui-shell__header">
        <span className="openui-shell__title">{title}</span>
        <IconButton
          ref={expandRef}
          className="openui-shell__button"
          icon={<Maximize2 />}
          shape="circle"
          variant="tertiary"
          size="extra-small"
          aria-label={`Expand ${title}`}
          onClick={() => setOpen(true)}
        />
      </div>
      <div className="openui-shell__body">{children}</div>
      {open && (
        <ShellLightbox title={title} closing={closing} onClose={close}>
          {children}
        </ShellLightbox>
      )}
    </section>
  );
};

const ShellLightbox = ({
  title,
  closing,
  onClose,
  children,
}: {
  title: string;
  closing: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}) => {
  const { portalThemeClassName } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Focus the panel, lock page scroll, and close on Escape.
  useEffect(() => {
    panelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Keep Tab inside the panel.
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return e.preventDefault();
        const first = items[0]!;
        const last = items[items.length - 1]!;
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className={clsx(
        "openui-shell-lightbox",
        closing && "openui-shell-lightbox--closing",
        portalThemeClassName,
      )}
    >
      <div className="openui-shell-lightbox__backdrop" onClick={onClose} />
      <div
        ref={panelRef}
        className="openui-shell-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="openui-shell__header">
          <span id={titleId} className="openui-shell__title">
            {title}
          </span>
          <IconButton
            className="openui-shell__button"
            icon={<X />}
            shape="circle"
            variant="tertiary"
            size="extra-small"
            aria-label="Close"
            onClick={onClose}
          />
        </div>
        <div className="openui-shell-lightbox__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
