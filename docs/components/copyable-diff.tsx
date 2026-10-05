"use client";

import { Check, Clipboard } from "lucide-react";
import { useState } from "react";

export function CopyableDiff({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/^\n|\n$/g, "").split("\n");
  const finalCode = lines
    .filter((line) => !line.startsWith("-"))
    .map((line) => (/^[+=]/.test(line) ? line.slice(1) : line))
    .join("\n");

  async function copy() {
    await navigator.clipboard.writeText(finalCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <figure className="not-prose relative my-4 overflow-hidden rounded-xl border bg-fd-card text-sm shadow-sm">
      <button
        type="button"
        aria-label={copied ? "Copied" : "Copy final code"}
        onClick={copy}
        className="absolute top-2 right-2 z-10 inline-flex size-7 items-center justify-center rounded-md text-fd-muted-foreground backdrop-blur hover:bg-fd-accent hover:text-fd-accent-foreground"
      >
        {copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}
      </button>
      <pre className="overflow-auto py-3.5 font-mono text-[0.8125rem]">
        <code>
          {lines.map((line, index) => {
            const marker = line[0];
            const changed = marker === "+" || marker === "-";
            const content = changed || marker === "=" ? line.slice(1) : line;

            return (
              <span
                key={index}
                className={`block min-w-max px-4 ${
                  marker === "+"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : marker === "-"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300"
                      : ""
                }`}
              >
                <span className="mr-3 inline-block w-2 select-none opacity-70">
                  {changed ? marker : " "}
                </span>
                {content || " "}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}
