"use client";

import clsx from "clsx";
import { useState } from "react";
import { Button } from "../Button";
import { names, styles } from "./code.styles";

export interface CodeProps {
  code: string;
  /** Shown in the header. */
  language?: string;
}

/** A code block with a header: the language and a copy button. */
export function Code({ code, language }: CodeProps) {
  const [copied, setCopied] = useState(false);
  const copy = () =>
    void navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  return (
    <div className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.head, names.head)}>
        <span>{language || "code"}</span>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? "check" : "copy"}
          aria-label="Copy code"
          onClick={copy}
          className={clsx(styles.copy, names.copy)}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className={clsx(styles.pre, names.pre)}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
