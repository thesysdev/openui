import { Sparkles } from "lucide-react";

const STARTERS = [
  {
    displayText: "Sales dashboard",
    prompt:
      "Use the analytics subagent to render a sales dashboard with a bar chart of monthly revenue for Jan–Jun (Jan: $12k, Feb: $15k, Mar: $11k, Apr: $18k, May: $22k, Jun: $19k) and a total revenue summary card.",
  },
  {
    displayText: "User signup form",
    prompt:
      "Use the analytics subagent to render a user signup form with fields for full name, email, password, and a role selector dropdown with options: Admin, Editor, Viewer.",
  },
  {
    displayText: "Expense tracker",
    prompt:
      "Use the analytics subagent to render a pie chart breaking down monthly expenses: Rent $1200, Food $450, Transport $150, Entertainment $200, Utilities $180.",
  },
  {
    displayText: "Team directory",
    prompt:
      "Use the analytics subagent to render a team directory table with 5 members showing name, role, department, and status (active/away). Use sample data.",
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
        Ask me anything — I can build charts, dashboards, forms, tables, and interactive UI powered
        by OpenUI.
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
