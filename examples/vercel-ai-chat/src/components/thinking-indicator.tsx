import { Bot, Loader2 } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 max-w-3xl">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 size={14} className="animate-spin" />
        Thinking…
      </div>
    </div>
  );
}
