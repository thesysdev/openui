"use client";

import { AnimatePresence, motion, type Transition } from "motion/react";
import type { ReactNode } from "react";

const NO_SHADOW = "0px 0px 0px rgba(0,0,0,0)";

interface ExpandableItemProps {
  open: boolean;
  expandedHeight: number;
  collapsedHeight: number;
  className?: string;
  activeShadow?: string;
  zIndexOpen?: number;
  zIndexClosed?: number;
  transition?: Transition;
  onActivate?: () => void;
  children: ReactNode;
}

export function ExpandableItem({
  open,
  expandedHeight,
  collapsedHeight,
  className,
  activeShadow = NO_SHADOW,
  zIndexOpen = 2,
  zIndexClosed = 1,
  transition,
  onActivate,
  children,
}: ExpandableItemProps) {
  return (
    <motion.div
      className={className}
      animate={{
        height: open ? expandedHeight : collapsedHeight,
        boxShadow: open ? activeShadow : NO_SHADOW,
        zIndex: open ? zIndexOpen : zIndexClosed,
      }}
      transition={transition}
      onClick={onActivate}
      onMouseEnter={onActivate}
    >
      {children}
    </motion.div>
  );
}

interface CollapsiblePanelProps {
  open: boolean;
  className?: string;
  transition?: Transition;
  children: ReactNode;
}

export function CollapsiblePanel({
  open,
  className,
  transition,
  children,
}: CollapsiblePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={className}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
