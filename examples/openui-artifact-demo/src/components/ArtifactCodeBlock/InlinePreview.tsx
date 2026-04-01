"use client";

interface InlinePreviewProps {
  language: string;
  title: string;
  codeString: string;
  open: () => void;
  isActive: boolean;
}

export function InlinePreview({ language, title, codeString, open, isActive }: InlinePreviewProps) {
  const truncatedCode = codeString.split("\n").slice(0, 6).join("\n");

  return (
    <div className="my-2 overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <svg
            className="h-4 w-4 shrink-0 text-zinc-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
          {language}
        </span>
      </div>

      {/* Code preview */}
      <div className="relative">
        <pre className="overflow-hidden px-4 py-3 text-[13px] leading-relaxed">
          <code className="text-zinc-300">{truncatedCode}</code>
        </pre>
        {/* Gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-zinc-900 to-transparent" />
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-700/50 px-4 py-2.5">
        <button
          type="button"
          onClick={() => !isActive && open()}
          className={`text-sm font-medium transition-colors ${
            isActive
              ? "cursor-default text-emerald-400"
              : "cursor-pointer text-blue-400 hover:text-blue-300"
          }`}
        >
          {isActive ? "✓ Viewing" : "View Code →"}
        </button>
      </div>
    </div>
  );
}
