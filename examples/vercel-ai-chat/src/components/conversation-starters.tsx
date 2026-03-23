import { Sparkles } from "lucide-react";

const STARTERS = [
  { displayText: "Weather in Tokyo", prompt: "What's the weather like in Tokyo right now?" },
  { displayText: "AAPL stock price", prompt: "What's the current Apple stock price?" },
  {
    displayText: "Contact form",
    prompt: "Build me a contact form with name, email, topic, and message fields.",
  },
  {
    displayText: "Data table",
    prompt: "Show me a table of the top 5 programming languages by popularity with year created.",
  },
];

export function ConversationStarters({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4">
        <Sparkles size={22} className="text-white" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
        What can I help you with?
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
        Ask me anything — I can check weather, look up stocks, do math, search the web, and build
        interactive UI.
      </p>
      <div className="grid grid-cols-2 gap-2 w-full max-w-md">
        {STARTERS.map((s) => (
          <button
            key={s.prompt}
            onClick={() => onSelect(s.prompt)}
            className="text-left text-sm px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            {s.displayText}
          </button>
        ))}
      </div>
    </div>
  );
}
