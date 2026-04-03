"use client";

import { useState, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, CheckCheck } from "lucide-react";

interface ArtifactViewProps {
  language: string;
  codeString: string;
  title: string;
}

export function ArtifactView({ language, codeString, title }: ArtifactViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const textarea = document.createElement("textarea");
      textarea.value = codeString;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeString]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-700/50 px-4 py-2">
        <span className="text-sm font-medium text-zinc-300">{title}</span>
        <div className="flex items-center gap-3">
          <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700/50 hover:text-zinc-200"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="min-h-0 flex-1 overflow-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "13px",
            lineHeight: "1.6",
            minHeight: "100%",
          }}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "#555",
            userSelect: "none",
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
