import { SendHorizonal, Square } from "lucide-react";
import { useRef, useState } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatInput({ input, isLoading, onInputChange, onSend, onStop }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [composing, setComposing] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !composing) {
      e.preventDefault();
      onSend(input);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(input);
  };

  return (
    <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-start gap-2">
        <div className="flex-1 flex relative items-center">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            placeholder="Send a message…"
            rows={1}
            className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 transition-shadow"
            style={{ maxHeight: 160 }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
            }}
          />
        </div>
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="shrink-0 w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Square size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="shrink-0 w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SendHorizonal size={16} />
          </button>
        )}
      </form>
    </div>
  );
}
