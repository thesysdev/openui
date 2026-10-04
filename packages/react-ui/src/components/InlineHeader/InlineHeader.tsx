import clsx from "clsx";
import { InlineMarkdownRenderer } from "../InlineMarkdownRenderer";

export interface InlineHeaderProps {
  heading?: string;
  description?: string;
  className?: string;
}

export const InlineHeader = ({ heading, description, className }: InlineHeaderProps) => {
  if (!heading && !description) return null;

  return (
    <div className={clsx("openui-inline-header", className)}>
      {heading && (
        <div className="openui-inline-header-heading">
          <InlineMarkdownRenderer content={heading} />
        </div>
      )}
      {description && (
        <div className="openui-inline-header-description">
          <InlineMarkdownRenderer content={description} />
        </div>
      )}
    </div>
  );
};
