"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeProvider";

export interface ModalProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

const sizeClass: Record<string, string> = {
  sm: "openui-modal-sm",
  md: "openui-modal-md",
  lg: "openui-modal-lg",
};

export const Modal: React.FC<ModalProps> = ({
  title,
  open,
  onOpenChange,
  size = "md",
  children,
}) => {
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

  // Focus trap — focus the content on open
  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={clsx("openui-modal-root", portalThemeClassName)}>
      <div className="openui-modal-overlay" onClick={handleClose} />
      <div
        ref={contentRef}
        className={clsx("openui-modal-content", sizeClass[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="openui-modal-header">
          <h2 className="openui-modal-title">{title}</h2>
          <button className="openui-modal-close" aria-label="Close" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>
        <div className="openui-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};
