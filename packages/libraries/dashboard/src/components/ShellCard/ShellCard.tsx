"use client";

import { Button, Card } from "@openuidev/react-components";
import clsx from "clsx";
import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { names, styles } from "./shellCard.styles";

export type ShellCardSize = "small" | "medium" | "large";

export interface ShellCardProps {
  size: ShellCardSize;
  /** Clip the body to a preview height and offer an Expand control when it overflows. */
  collapsed?: boolean;
  streaming?: boolean;
  /** Accessible name of the expanded dialog. */
  modalTitle?: string;
  children?: ReactNode;
}

/** The card frame Medium and Large cards render into, with its expand modal. */
export function ShellCard({
  size,
  collapsed = false,
  streaming = false,
  modalTitle = "Card details",
  children,
}: ShellCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const showCollapseControl = collapsed && isOverflowing;

  useEffect(() => {
    if (!collapsed) {
      setIsModalOpen(false);
      setIsOverflowing(false);
      return;
    }

    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    const wrapElement = contentElement.parentElement;

    const updateOverflowState = () => {
      if (!wrapElement) return;
      setIsOverflowing(
        wrapElement.clientHeight > 0 && contentElement.scrollHeight > wrapElement.clientHeight + 1,
      );
    };

    updateOverflowState();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateOverflowState);
    resizeObserver.observe(contentElement);

    return () => resizeObserver.disconnect();
  }, [collapsed]);

  useEffect(() => {
    if (!showCollapseControl) {
      setIsModalOpen(false);
    }
  }, [showCollapseControl]);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  return (
    <Card
      width="full"
      variant="card"
      data-streaming={streaming || undefined}
      data-collapsed={collapsed || undefined}
      className={clsx(styles.root, names.root, styles.size[size], names.size[size])}
    >
      <div
        data-collapsed={collapsed || undefined}
        className={clsx(styles.contentWrap, names.contentWrap)}
      >
        <div ref={contentRef} className={clsx(styles.content, names.content)}>
          {children}
        </div>
        {showCollapseControl && (
          <div className={clsx(styles.collapseFade, names.collapseFade)} aria-hidden="true" />
        )}
      </div>
      {showCollapseControl && (
        <div className={clsx(styles.collapseControl, names.collapseControl)}>
          <Button
            variant="secondary"
            size="small"
            iconLeft={<Maximize2 size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Expand
          </Button>
        </div>
      )}
      {isModalOpen && (
        <div
          className={clsx(styles.modal, names.modal)}
          role="dialog"
          aria-modal="true"
          aria-label={modalTitle}
        >
          <button
            type="button"
            className={clsx(styles.modalOverlay, names.modalOverlay)}
            aria-label="Minimize expanded card"
            onClick={() => setIsModalOpen(false)}
          />
          <div className={clsx(styles.modalFrame, names.modalFrame)}>
            <div className={clsx(styles.modalMinimize, names.modalMinimize)}>
              <Button
                variant="secondary"
                size="small"
                iconLeft={<Minimize2 size={14} />}
                onClick={() => setIsModalOpen(false)}
              >
                Minimize
              </Button>
            </div>
            <div className={clsx(styles.modalContent, names.modalContent)}>
              <div className={clsx(styles.modalBody, names.modalBody)}>
                <div className={clsx(styles.content, names.content)}>{children}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
