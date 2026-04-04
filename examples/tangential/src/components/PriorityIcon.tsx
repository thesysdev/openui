import { ChevronsUp, ChevronUp, Minus } from "lucide-react";

export const PriorityIcon = ({ priority }: { priority: number }) => {
  if (priority === 1) return <ChevronsUp className="size-3.5 text-red-400" />;
  if (priority === 2) return <ChevronUp className="size-3.5 text-orange-400" />;
  if (priority === 3) return <Minus className="size-3.5 text-yellow-300" />;
  if (priority === 4) return <Minus className="size-3.5 text-zinc-500" />;
  return <Minus className="size-3.5 text-zinc-600" />;
};
