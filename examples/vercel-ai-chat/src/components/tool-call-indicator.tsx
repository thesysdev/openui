import { CheckCircle2, Loader2, Wrench } from "lucide-react";

export function ToolCallIndicator({ name, isDone }: { name: string; isDone: boolean }) {
  const label = name.replace(/_/g, " ");

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 w-fit">
      {isDone ? (
        <CheckCircle2 size={14} className="text-emerald-500" />
      ) : (
        <Loader2 size={14} className="animate-spin" />
      )}
      <Wrench size={12} />
      <span className="capitalize">{label}</span>
    </div>
  );
}
