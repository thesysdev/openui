import type { UIMessage } from "ai";
import { User } from "lucide-react";

function extractText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function UserMessage({ message }: { message: UIMessage }) {
  const text = extractText(message);

  return (
    <div className="flex gap-3 max-w-3xl justify-end ml-auto">
      <div className="px-4 py-2.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm leading-relaxed max-w-[80%]">
        {text}
      </div>
      <div className="shrink-0 w-7 h-7 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center">
        <User size={14} className="text-zinc-600 dark:text-zinc-300" />
      </div>
    </div>
  );
}
