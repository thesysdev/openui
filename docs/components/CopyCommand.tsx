"use client";

import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy } from "lucide-react";
import "./CopyCommand.css";

/** The local-run command in a dark box, with a copy button pinned to its right edge. */
export function CopyCommand({ command }: { command: string }) {
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(command));

  return (
    <div className="copy-command">
      <pre>
        <code>{command}</code>
      </pre>
      <button
        type="button"
        className="copy-command-button"
        aria-label={copied ? "Command copied" : "Copy command"}
        onClick={onCopy}
      >
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      </button>
    </div>
  );
}
