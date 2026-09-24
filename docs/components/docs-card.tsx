import { Card } from "fumadocs-ui/components/card";
import { ChevronRight } from "lucide-react";
import type { ComponentProps } from "react";

/** Fumadocs `Card` with a trailing chevron on linked cards, styled in `app/docs-theme.css`. */
export function DocsCard({ title, className, ...props }: ComponentProps<typeof Card>) {
  if (!props.href) return <Card title={title} className={className} {...props} />;

  return (
    <Card
      {...props}
      className={className ? `docs-card ${className}` : "docs-card"}
      title={
        <span className="docs-card-title">
          {title}
          <ChevronRight aria-hidden className="docs-card-arrow" size={16} />
        </span>
      }
    />
  );
}
