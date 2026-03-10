import type { ReactNode } from "react";
import { SimpleCard } from "./simple-card";

interface FeatureCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  href?: string;
  direction?: "vertical" | "horizontal";
}

export function FeatureCard({ icon, title, description, href, direction = "vertical" }: FeatureCardProps) {
  let content;

  if (direction === "horizontal") {
    content = (
      <SimpleCard className="p-4">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex shrink-0 size-9 items-center justify-center rounded-lg bg-fd-muted">
              <div className="flex size-4 items-center justify-center text-fd-foreground">{icon}</div>
            </div>
          )}
          <div>
            <h3 className="mb-1 text-base font-semibold">{title}</h3>
            <p className="text-sm text-fd-muted-foreground">{description}</p>
          </div>
        </div>
      </SimpleCard>
    );
  } else {
    content = (
      <SimpleCard className="p-6 flex flex-col h-full">
        {icon && (
          <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-fd-muted">
            <div className="flex size-5 items-center justify-center text-fd-foreground">{icon}</div>
          </div>
        )}
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-fd-muted-foreground">{description}</p>
      </SimpleCard>
    );
  }

  if (href) {
    return (
      <a href={href} className="flex no-underline hover:opacity-80 transition-opacity">
        {content}
      </a>
    );
  }

  return content;
}

interface FeatureCardsProps {
  children: ReactNode;
  direction?: "vertical" | "horizontal";
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

const colsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export function FeatureCards({ children, direction = "vertical", cols, className }: FeatureCardsProps) {
  let gridClass: string;

  if (direction === "horizontal") {
    const colClass = cols ? colsMap[cols] : "sm:grid-cols-1";
    gridClass = `grid grid-cols-1 gap-3 ${colClass}`;
  } else {
    gridClass = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch";
  }

  return (
    <div className={`${gridClass} ${className ?? ""}`}>
      {children}
    </div>
  );
}
