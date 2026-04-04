import { ChevronDown, ChevronRight } from "lucide-react";

export const IssueGroupHeader = ({
  name,
  count,
  collapsed,
  onToggle,
}: {
  name: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-left text-sm hover:bg-[var(--hover)]"
    >
      {collapsed ? (
        <ChevronRight className="size-3.5 text-[var(--muted)]" />
      ) : (
        <ChevronDown className="size-3.5 text-[var(--muted)]" />
      )}
      <span className="font-medium text-white">{name}</span>
      <span className="rounded bg-[var(--panel-2)] px-1.5 py-0.5 text-xs text-[var(--muted)]">
        {count}
      </span>
    </button>
  );
};
