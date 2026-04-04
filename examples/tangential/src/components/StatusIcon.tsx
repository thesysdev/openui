import { cn } from "@/lib/utils";

const stateColor: Record<string, string> = {
  Backlog: "bg-slate-500",
  Todo: "bg-zinc-400",
  "In Progress": "bg-blue-500",
  "In Development": "bg-violet-500",
  "In Review": "bg-amber-400",
  Done: "bg-green-500",
  Cancelled: "bg-zinc-500",
};

export const StatusIcon = ({ state }: { state: string }) => {
  return (
    <span className={cn("inline-block size-2 rounded-full", stateColor[state] ?? "bg-zinc-500")} />
  );
};
