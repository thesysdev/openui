"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  title?: string;
  language?: string;
  codeBlockClassName?: string;
  className?: string;
}

export function CodeBlock({
  code,
  title,
  codeBlockClassName = "",
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 dark:border-[var(--color-doc-border)] flex flex-col ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-[var(--color-doc-border)] dark:bg-[var(--color-doc-surface)]">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {title}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}
      <pre className={`grow-1 overflow-x-auto bg-[var(--color-doc-code-bg)] p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${codeBlockClassName}`}>
        <code className="border-0! bg-transparent!">{code}</code>
      </pre>
    </div>
  );
}
