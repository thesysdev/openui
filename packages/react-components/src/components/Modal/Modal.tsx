"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeProvider";
import { modalStyles, names } from "./modal.styles";

export interface ModalProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  title,
  open,
  onOpenChange,
  size = "md",
  children,
}) => {
  const styles = modalStyles;
  const { portalThemeClassName } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  // Focus the content on open.
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={clsx(
        styles.root,
        names.root,
        styles.size[size],
        names.size[size],
        portalThemeClassName,
      )}
    >
      <div className={clsx(styles.overlay, names.overlay)} onClick={handleClose} />
      <div
        ref={contentRef}
        className={clsx(styles.content, names.content)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="openui-modal-title"
        tabIndex={-1}
      >
        <div className={clsx(styles.header, names.header)}>
          <h2 id="openui-modal-title" className={clsx(styles.title, names.title)}>
            {title}
          </h2>
          <button
            className={clsx(styles.close, names.close)}
            aria-label="Close"
            onClick={handleClose}
          >
            <X size={18} className={clsx(styles.closeIcon, names.closeIcon)} />
          </button>
        </div>
        <div className={clsx(styles.body, names.body)}>{children}</div>
      </div>
    </div>,
    document.body,
  );
};
