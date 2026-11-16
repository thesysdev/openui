"use client";

import Link from "@/components/site-link";
import { copyText } from "@/lib/copy-text";
import { Check, Copy } from "lucide-react";
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

interface ClipboardCommandButtonProps {
  command: string;
  children: ReactNode;
  className?: string;
  iconContainerClassName?: string;
  iconFrameClassName?: string;
  iconPosition?: "start" | "end";
  copyIconColor?: string;
  /** Renders it as one of the site's pills instead of the bare command style. */
  variant?: PillVariant;
  type?: ButtonType;
  onCopyChange?: (copied: boolean) => void;
  onCopySuccess?: (command: string) => void;
}

export function ClipboardCommandButton({
  command,
  children,
  className = "",
  iconContainerClassName = "",
  iconFrameClassName = "",
  iconPosition = "end",
  copyIconColor = "white",
  variant,
  type = "button",
  onCopyChange,
  onCopySuccess,
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
    onCopySuccess?.(command);
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
      className={[
        styles.clipboardCommandButton,
        variant ? styles.pillBase : "",
        variant ? VARIANT_CLASS_MAP[variant] : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {iconPosition === "start" ? icon : null}
      {children}
      {iconPosition === "end" ? icon : null}
    </button>
  );
}

export type PillVariant = "primary" | "secondary" | "ghost";

interface PillLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  arrow?: ReactNode;
  external?: boolean;
  variant?: PillVariant;
  fullWidthMobile?: boolean;
}

const VARIANT_CLASS_MAP: Record<PillVariant, string> = {
  primary: styles.pillPrimary,
  secondary: styles.pillSecondary,
  ghost: styles.pillGhost,
};

export function PillLink({
  href,
  children,
  className = "",
  arrow,
  external = false,
  variant,
  fullWidthMobile = false,
}: PillLinkProps) {
  const composedClassName = [
    variant ? styles.pillBase : "",
    variant ? VARIANT_CLASS_MAP[variant] : "",
    fullWidthMobile ? styles.pillFullWidthMobile : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {children}
      {arrow}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={composedClassName}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={composedClassName}>
      {content}
    </Link>
  );
}
