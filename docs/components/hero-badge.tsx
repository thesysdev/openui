import * as LucideIcons from "lucide-react";
import React from "react";

interface HeroBadgeProps {
  icon: string;
  text: string;
}

export function HeroBadge({ icon, text }: HeroBadgeProps) {
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number }>>
  )[icon];

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
      {IconComponent && <IconComponent size={14} />}
      <span>{text}</span>
    </div>
  );
}
