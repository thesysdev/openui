"use client";

import clsx from "clsx";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { json } from "./describe";
import { partClass as cx } from "./sourcesDialog.styles";

/** A 32px icon button, named by its label. */
export function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={clsx(cx("icon-button"), className)}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** How long a copy button shows its check. */
const COPIED_MS = 1500;

/** Copying to the clipboard: which copy button last copied (for 1.5s), and whether one failed. */
export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const copy = useCallback(async (key: string, value: unknown) => {
    try {
      await navigator.clipboard.writeText(typeof value === "string" ? value : json(value));
      setFailed(false);
      setCopied(key);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), COPIED_MS);
    } catch {
      setFailed(true);
    }
  }, []);
  return { copied, failed, copy };
}

/** A copy button: "Copy", then "Copied" with a check while it confirms. */
export function CopyButton({
  done,
  onCopy,
  className,
}: {
  done: boolean;
  onCopy: () => void;
  className?: string;
}) {
  return (
    <IconAction className={className} label={done ? "Copied" : "Copy"} onClick={onCopy}>
      {/* Keyed, so the swap to the check (and back) replays its arrival. */}
      <span className={cx("swap")} key={done ? "done" : "copy"}>
        {done ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </span>
    </IconAction>
  );
}

/** What a copy did, for screen readers. */
export function CopyStatus({ copied, failed }: { copied: boolean; failed: boolean }) {
  return (
    <span className={cx("sr-only")} role="status">
      {failed ? "Couldn't copy. Please try again." : copied ? "Copied to clipboard" : ""}
    </span>
  );
}
