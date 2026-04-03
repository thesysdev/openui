"use client";

import { AnimatePresence, motion, type TargetAndTransition, type Transition } from "motion/react";
import type { ReactNode } from "react";

const NO_SHADOW = "0px 0px 0px rgba(0,0,0,0)";
const DEFAULT_PANEL_INITIAL = { height: 0, opacity: 0 };
const DEFAULT_PANEL_ANIMATE = { height: "auto", opacity: 1 };
const DEFAULT_PANEL_EXIT = { height: 0, opacity: 0 };

interface AccordionItemProps {
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

export function AccordionItem({
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
}: AccordionItemProps) {
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

interface AccordionPanelProps {
  open: boolean;
  className?: string;
  transition?: Transition;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  exit?: TargetAndTransition;
  children: ReactNode;
}

export function AccordionPanel({
  open,
  className,
  transition,
  initial = DEFAULT_PANEL_INITIAL,
  animate = DEFAULT_PANEL_ANIMATE,
  exit = DEFAULT_PANEL_EXIT,
  children,
}: AccordionPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={className}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
