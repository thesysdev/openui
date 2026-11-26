"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useSyncExternalStore, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { dialogNames, dialogStyles } from "../SourcesContents/sourcesDialog.styles";
import { phone } from "../shared.styles";

/** Longer than the sheet's 300ms slide, in case `transitionend` never comes. */
export const SHEET_EXIT_MS = 350;

const phoneQuery = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(phone)
    : null;

function subscribe(onChange: () => void) {
  const query = phoneQuery();
  if (!query) return () => {};
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
  query.addListener?.(onChange);
  return () => query.removeListener?.(onChange);
}
const isPhone = () => phoneQuery()?.matches === true;
const notPhone = () => false;

/** Whether the viewport is below 640px, where Sources open in a bottom sheet. */
export function usePhone(): boolean {
  return useSyncExternalStore(subscribe, isPhone, notPhone);
}

/**
 * The modal bottom sheet the Sources popover and the All sources menu open in on phones: a dim
 * backdrop, a tap on which closes it, and the sheet sliding up from the bottom edge. The sheet
 * takes the surface's own attributes (its role, name, state and keyboard handling) and contents.
 * It has no hover-only behaviour and no blur.
 */
export function SheetFrame({
  open,
  setRef,
  themeClassName,
  attributes,
  onDismiss,
  children,
}: {
  open: boolean;
  setRef: (element: HTMLDivElement | null) => void;
  themeClassName?: string;
  attributes: HTMLAttributes<HTMLDivElement> & Record<string, unknown>;
  /** A tap on the backdrop. */
  onDismiss: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <>
      <div
        className={clsx(dialogStyles.overlay, dialogNames.overlay, themeClassName)}
        data-openui-sources-sheet-backdrop=""
        data-state={open ? "open" : "closed"}
        aria-hidden
        // Leaving, it lets taps through to the page.
        style={open ? undefined : { pointerEvents: "none" }}
        onClick={open ? onDismiss : undefined}
      />
      <div
        ref={setRef}
        {...attributes}
        className={clsx(dialogStyles.root, dialogStyles.body, dialogNames.root, themeClassName)}
        data-openui-sources-sheet=""
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

/** The sheet's close control, at the end of its header. */
export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className={clsx(dialogStyles.button, dialogStyles.close, dialogNames.close)}
      aria-label="Close"
      title="Close"
      onClick={onClose}
    >
      <X size={16} aria-hidden />
    </button>
  );
}
