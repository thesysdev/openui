"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CheckIcon, CopyIcon, COPY_FEEDBACK_MS } from "./shared";
import styles from "./shared.module.css";

type ButtonType = ButtonHTMLAttributes<HTMLButtonElement>["type"];

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
        className={[
          styles.iconLayer,
          copied ? styles.iconHidden : styles.iconVisible,
          className,
        ].filter(Boolean).join(" ")}
      >
        <CopyIcon color={color} />
      </span>
      <span
        className={[
          styles.iconLayer,
          copied ? styles.iconVisible : styles.iconHidden,
          className,
        ].filter(Boolean).join(" ")}
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
  style?: CSSProperties;
  iconContainerClassName?: string;
  iconFrameClassName?: string;
  iconPosition?: "start" | "end";
  copyIconColor?: string;
  type?: ButtonType;
}

export function ClipboardCommandButton({
  command,
  children,
  className = "",
  style,
  iconContainerClassName = "",
  iconFrameClassName = "",
  iconPosition = "end",
  copyIconColor = "white",
  type = "button",
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
    if (copied) return;

    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      resetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, COPY_FEEDBACK_MS);
    } catch {
      setCopied(false);
    }
  };

  const icon = (
    <span className={iconContainerClassName || undefined}>
      <CopyStatusIcon
        copied={copied}
        frameClassName={iconFrameClassName}
        color={copyIconColor}
      />
    </span>
  );

  return (
    <button
      type={type}
      onClick={handleClick}
      className={className}
      style={style}
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
  style?: CSSProperties;
  arrow?: ReactNode;
  external?: boolean;
}

export function PillLink({
  href,
  children,
  className = "",
  style,
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {content}
    </Link>
  );
}
