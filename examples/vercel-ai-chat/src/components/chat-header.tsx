import { Sparkles } from "lucide-react";

export function ChatHeader() {
  return (
    <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vercel AI Chat</h1>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-1">
          Vercel AI SDK + OpenUI Renderer
        </span>
      </div>
    </header>
  );
}
