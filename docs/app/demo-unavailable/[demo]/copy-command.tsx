"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy } from "lucide-react";

/** The local-run command in a dark box, with a copy button pinned to its right edge. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(command));

  return (
    <div className="demo-unavailable-commands">
      <pre>
        <code>{command}</code>
      </pre>
      <button
        type="button"
        className="demo-unavailable-copy"
        aria-label={copied ? "Command copied" : "Copy command"}
        onClick={onCopy}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </div>
  );
}
