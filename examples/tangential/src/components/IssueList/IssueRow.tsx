import { PriorityIcon } from "@/components/PriorityIcon";
import { StatusIcon } from "@/components/StatusIcon";
import { cn, shortDate } from "@/lib/utils";
import Link from "next/link";

export type IssueRowModel = {
  id: string;
  identifier: string;
  title: string;
  projectName?: string;
  labels: Array<{ id: string; name: string; color: string }>;
  priority: number;
  assigneeName?: string;
  stateName: string;
  createdAt: string;
};

export const IssueRow = ({ issue }: { issue: IssueRowModel }) => {
  return (
    <Link
      href={`/issues/${issue.id}`}
      className={cn(
        "grid grid-cols-[18px_80px_minmax(320px,1fr)_180px_220px_42px_80px] items-center gap-2 px-3 py-2",
        "border-b border-[var(--border)] text-sm hover:bg-[var(--hover)]",
      )}
    >
      <StatusIcon state={issue.stateName} />
      <span className="font-mono text-xs text-[var(--muted)]">{issue.identifier}</span>
      <span className="truncate text-[13px] text-white">{issue.title}</span>
      <span className="truncate text-xs text-[var(--muted)]">{issue.projectName ?? "-"}</span>
      <div className="flex items-center gap-1 overflow-hidden">
        {issue.labels.slice(0, 2).map((label) => (
          <span
            key={label.id}
            className="truncate rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ background: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>
      <PriorityIcon priority={issue.priority} />
      <div className="truncate text-xs text-[var(--muted)]">{shortDate(issue.createdAt)}</div>
    </Link>
  );
};
