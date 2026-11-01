"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { names, styles } from "./code.styles";

export interface CodeProps {
  code: string;
  /** Shown in the header. */
  language?: string;
}

const STATES = {
  idle: { icon: "copy", text: "Copy", label: "Copy code" },
  copied: { icon: "check", text: "Copied", label: "Copied" },
  failed: { icon: "x", text: "Couldn't copy", label: "Couldn't copy code" },
} as const;

/** A code block with a header: the language and a copy button. */
export function Code({ code, language }: CodeProps) {
  const [state, setState] = useState<keyof typeof STATES>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const show = (next: keyof typeof STATES) => {
    setState(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 1500);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      show("copied");
    } catch {
      // Blocked by the browser, or no clipboard at all on a page that isn't https.
      show("failed");
    }
  };
  const { icon, text, label } = STATES[state];
  return (
    <div className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.head, names.head)}>
        <span>{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={icon}
          aria-label={label}
          onClick={() => void copy()}
          className={clsx(styles.copy, names.copy)}
        >
          {text}
        </Button>
      </div>
      <pre className={clsx(styles.pre, names.pre)}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
