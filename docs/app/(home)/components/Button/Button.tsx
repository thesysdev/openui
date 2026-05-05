"use client";

import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonType = ButtonHTMLAttributes<HTMLButtonElement>["type"];
const COPY_FEEDBACK_MS = 1800;

function CopyIcon({ color = "white" }: { color?: string }) {
  return <Copy className={styles.copyIcon} color={color} strokeWidth={1.75} />;
}

function CheckIcon({ color = "white" }: { color?: string }) {
  return <Check className={styles.copyIcon} color={color} strokeWidth={2} />;
}

interface CopyStatusIconProps {
  copied: boolean;
  className?: string;
  frameClassName?: string;
  color?: string;
}

function CopyStatusIcon({
  copied,
  className = "",
  frameClassName = "",
  color = "white",
}: CopyStatusIconProps) {
  return (
    <span className={[styles.copyIconFrame, frameClassName].filter(Boolean).join(" ")}>
      <span
        className={[styles.iconLayer, copied ? styles.iconHidden : styles.iconVisible, className]
          .filter(Boolean)
          .join(" ")}
      >
        <CopyIcon color={color} />
      </span>
      <span
        className={[styles.iconLayer, copied ? styles.iconVisible : styles.iconHidden, className]
          .filter(Boolean)
          .join(" ")}
      >
        <CheckIcon color={color} />
      </span>
    </span>
  );
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to execCommand fallback
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

interface ClipboardCommandButtonProps {
  command: string;
  children: ReactNode;
  className?: string;
  iconContainerClassName?: string;
  iconFrameClassName?: string;
  iconPosition?: "start" | "end";
  copyIconColor?: string;
  type?: ButtonType;
  onCopyChange?: (copied: boolean) => void;
}

export function ClipboardCommandButton({
  command,
  children,
  className = "",
  iconContainerClassName = "",
  iconFrameClassName = "",
  iconPosition = "end",
  copyIconColor = "white",
  type = "button",
  onCopyChange,
}: ClipboardCommandButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    const ok = await copyText(command);
    if (!ok) {
      onCopyChange?.(false);
      return;
    }
    setCopied(true);
    onCopyChange?.(true);
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      setCopied(false);
      onCopyChange?.(false);
    }, COPY_FEEDBACK_MS);
  };

  const icon = (
    <span className={iconContainerClassName || undefined}>
      <CopyStatusIcon copied={copied} frameClassName={iconFrameClassName} color={copyIconColor} />
    </span>
  );

  return (
    <button
      type={type}
      onClick={handleClick}
      className={[styles.clipboardCommandButton, className].filter(Boolean).join(" ")}
    >
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </button>
  );
}

interface PillLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  arrow?: ReactNode;
  external?: boolean;
}

export function PillLink({
  href,
  children,
  className = "",
  arrow,
  external = false,
}: PillLinkProps) {
  const content = (
    <>
      {children}
      {arrow}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
