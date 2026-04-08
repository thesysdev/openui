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
    <div className="inline-flex items-center gap-2 rounded-full bg-fd-muted px-3 py-1 text-sm font-medium text-fd-foreground">
      {IconComponent && <IconComponent size={14} />}
      <span>{text}</span>
    </div>
  );
}
