interface SeparatorProps {
  className?: string;
}

export function Separator({ className }: SeparatorProps) {
  return <hr className={`border-slate-200 dark:border-slate-800 ${className ?? ""}`} />;
}
