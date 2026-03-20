"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import svgPaths from "@/imports/svg-urruvoh2be";
import styles from "./Button.module.css";

type ButtonType = ButtonHTMLAttributes<HTMLButtonElement>["type"];
const COPY_FEEDBACK_MS = 3000;

function CopyIcon({ color = "white" }: { color?: string }) {
  return (
    <svg className={styles.copyIcon} fill="none" viewBox="0 0 14.6667 14.6667">
      <path
        d={svgPaths.p102ea840}
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.33333"
      />
    </svg>
  );
}

function CheckIcon({ color = "white" }: { color?: string }) {
  return (
    <svg className={styles.copyIcon} fill="none" viewBox="0 0 14 14">
      <path
        d="M11.6667 3.5L5.25 9.91667L2.33334 7"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
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
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
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
